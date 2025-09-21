import type { Core } from '@strapi/strapi';

const bootstrap = ({ strapi }: { strapi: Core.Strapi }) => {
  // strapi.cron.add({
  //   '0 3 * * *': async () => {
  //     strapi.log.info('[local-updates] Running daily repeat jobs...');

  //     const entities = await strapi.db.query('api::segment.segment').findMany({
  //       where: { repeat: true },
  //     });

  //     for (const entity of entities) {
  //       try {
  //         const orchestrator = strapi
  //           .plugin('local-updates')
  //           .service('orchestrator');
          
  //         const { workflowId } = await orchestrator.runWorkflow(entity.payload.Workflow);
  //         strapi.log.info(`[local-updates] Repeat job ok for ${entity.id}, workflowId=${workflowId}`);
  //       } catch (err) {
  //         strapi.log.error(`Failed repeat job for ${entity.id}`, err);
  //       }
  //     }
  //   },
  // });
};

export default bootstrap;
