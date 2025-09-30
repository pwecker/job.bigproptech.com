import type { Core } from '@strapi/strapi';
import { type SyncService } from './services'
import { type WorkflowReturn } from './services'

// keystone
interface ContextStats {
  active: number;
  waiting: number;
  delayed: number;
  completed: number;
  failed: number;
}

interface ContextReport {
  [contextId: string]: ContextStats;
}

// local-updates
interface DocumentData {
  documentId: string;
  config: any;
  map: any;
}

interface ContextTracking {
  status: null | 'active'
  document: DocumentData;
}

const TAGS_ON: boolean = process.env.TAGS_ON === 'true';
const TAGS_CAP: number = Number(process.env.TAGS_CAP) || 1;
const UPDATES_RULE: string | null = process.env.UPDATES_RULE || null;

const bootstrap = async ({ strapi }: { strapi: Core.Strapi }) => {

  strapi.log.info(`[local-updates] scheduled: ${UPDATES_RULE}${TAGS_ON ? ', w/ tags' : ''}`)

  if (UPDATES_RULE) {

    const orchestrator = strapi.plugin('local-updates').service('orchestrator');
    const sync = strapi.plugin('local-updates').service('sync') as unknown as SyncService;
    const tags = strapi.plugin('local-updates').service('tag');

    const contexts: Record<string, ContextTracking> = {};
    let followUp: NodeJS.Timeout | null = null;
    const CHECK_STATUS_INTERVAL: number = 1000;

    async function syncAndTag(documentId: string, map: any): Promise<void> {
      const syncResult = await sync.syncFromSource({ documentId, map });
      const { processed } = syncResult
      const tagsResult: any | null = TAGS_ON ? 
        await tags.processBatch(TAGS_CAP) :
        null;
      strapi.log.info(`[local-updates] updates: ${processed}${tagsResult ? ', tags: ' + tagsResult.processed + '/' + TAGS_CAP : ''}`);
    }

    async function checkStatus(url: string): Promise<void> {
      const response = await fetch(`${url}/health/contexts/`);
      if (!response.ok) {
        throw new Error('Bad response from [keystone]');
      }
      const statuses = await response.json() as ContextReport;

      for (const context in statuses) {
        if (contexts[context]) {
          contexts[context].status = 'active';
        }
      }

      const actives = Object.keys(statuses);

      for (const context in contexts) {
        if (!actives.includes(context) && contexts[context].status === 'active') {
          const { documentId, map } = contexts[context].document;
          void syncAndTag(documentId, map);
          delete contexts[context];
        }
      }

      if (actives.length === 0) {
        return;
      } else {
        followUp = setTimeout(() => checkStatus(url), CHECK_STATUS_INTERVAL);
      }
    }

    strapi.cron.add({
      [UPDATES_RULE]: async () => {
        strapi.log.info('[local-updates] start');
        const documents = await strapi.documents('api::segment.segment').findMany({
          filters: { repeat: true },
        });
      
        if (documents.length === 0) return;

        Promise.all(
          documents.map(async (document) => {
            const { documentId, config, map } = document;
            const workflow = await orchestrator.runWorkflow(config);

            contexts[workflow.workflowId] = {
              status: null,
              document: { documentId, config, map }
            };

            return workflow;
          })
        ).then((workflows: WorkflowReturn[]) => {
          let url: string | null = null;
          workflows.forEach((workflow: WorkflowReturn) => {
            url = workflow.url ?? url;
          });

          if (url && !followUp) followUp = setTimeout(() => checkStatus(url), 0);
        });
      }

       //   documents.forEach(async (document) => {
      //     const { documentId, config, map } = document;

      //     // update
      //     strapi.log.info('[local-updates] update');
      //     const orchestrator = strapi.plugin('local-updates').service('orchestrator');
      //     const updateResult = await orchestrator.runWorkflow(config);
      //     const { containerId } = updateResult;

      //     // todo: poll context status
      //     // run sync when complete

      //     // sync
      //     strapi.log.info('[local-updates] sync');
      //     const sync = strapi.plugin('local-updates').service('sync') as unknown as SyncService;
      //     const syncResult = await sync.syncFromSource({ documentId, map });
      //     const { processed } = syncResult

      //     // tags
      //     strapi.log.info('[local-updates] tags?');
      //     const tags = strapi.plugin('local-updates').service('tag');
      //     const tagsResult: any | null = TAGS_ON ? 
      //       await tags.processBatch(TAGS_CAP) :
      //       null;

      //     strapi.log.info(`[local-updates] updates: ${processed}${tagsResult ? ', tags: ' + tagsResult.processed + '/' + TAGS_CAP : ''}`);
      //   });
    });
  }
};

export default bootstrap;
