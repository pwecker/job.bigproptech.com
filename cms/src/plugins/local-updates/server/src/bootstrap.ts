import type { Core } from '@strapi/strapi';

const TAGS_ON: boolean = process.env.TAGS_ON === 'true';
const TAGS_CAP: number = Number(process.env.TAGS_CAP) || 1;
const UPDATES_RULE: string | null = process.env.UPDATES_RULE || null;

const bootstrap = async ({ strapi }: { strapi: Core.Strapi }) => {

  strapi.log.info(`[local-updates] scheduled: ${UPDATES_RULE}${TAGS_ON ? ', w/ tags' : ''}`)

  if (UPDATES_RULE) {
    strapi.cron.add({
      [UPDATES_RULE]: async () => {
        strapi.log.info('[local-updates] start');
        const documents = await strapi.documents('api::segment.segment').findMany({
          filters: { repeat: true },
        });
      
        if (documents.length === 0) return;

        documents.forEach(async (document) => {
          const { config, map } = document;

          // update
          strapi.log.info('[local-updates] update');
          const orchestrator = strapi.plugin('local-updates').service('orchestrator');
          const updateResult = await orchestrator.runWorkflow(config);
          const { containerId } = updateResult;

          // sync
          strapi.log.info('[local-updates] sync');
          const sync = strapi.plugin('local-updates').service('sync');
          const syncResult = await sync.syncFromSource(map);
          const { processed } = syncResult

          // tags
          strapi.log.info('[local-updates] tags?');
          const tags = strapi.plugin('local-updates').service('tag');
          const tagsResult: any | null = TAGS_ON ? 
            await tags.processBatch(TAGS_CAP) :
            null;

          strapi.log.info(`[local-updates] updates: ${processed}${tagsResult ? ', tags: ' + tagsResult.processed + '/' + TAGS_CAP : ''}`);
        });
      }
    });
  }
};

export default bootstrap;
