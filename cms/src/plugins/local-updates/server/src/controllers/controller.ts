import type { Core } from '@strapi/strapi';
import type { TagServiceReturn, SyncService, DeleterService } from '../services'

const TAGS_ON = process.env.TAGS_ON === 'true';
const TAGS_CAP = Number(process.env.TAGS_CAP) || 1;

const controller: Core.Controller = {
  index(ctx) {
    ctx.body = strapi
      .plugin('local-updates')
      .service('service')
      .getWelcomeMessage();
  },

  async sync(ctx) {
    try {
      const sync = strapi.plugin('local-updates').service('sync') as unknown as SyncService;
      const { map, documentId } = ctx.request.body.payload;
      const result = await sync.syncFromSource({ documentId, map });
  
      ctx.body = { refreshed: true, ...result };
      ctx.status = 200;
    } catch (err) {
      console.error(err);
      ctx.body = { error: 'Failed to refresh data' };
      ctx.status = 500;
    }
  },

  async update(ctx) {
    try {
      const orchestrator = strapi.plugin('local-updates').service('orchestrator');
      const workflow = ctx.request.body.payload.config;
      const result = await orchestrator.runWorkflow(workflow);
      
      ctx.body = {
        success: true,
        workflowId: result.workflowId,
        url: result.url,
        containerId: result.containerId,
        message: 'Workflow started successfully'
      };
      ctx.status = 200;
    } catch (err) {
      console.error('Workflow error:', err);
      ctx.body = { error: 'Something went wrong' };
      ctx.status = 500;
    }
  },

  async tagOne(ctx) {
    try {
      if (!TAGS_ON) throw new Error('tags off');
      const tagService = strapi.plugin('local-updates').service('tag') as TagServiceReturn;
      const result = await tagService.processSingleItem();

      ctx.body = result.processed
        ? result
        : { message: 'No untagged items available.' };
      ctx.status = 200;
    } catch (err) {
      console.error(err);
      ctx.body = { error: 'Couldn\'t process single tag' };
      ctx.status = 500;
    }
  },

  async tagBatch(ctx) {
    try {
      if (!TAGS_ON) throw new Error('tags off');
      const tagService = strapi.plugin('local-updates').service('tag') as TagServiceReturn;

      // todo: tag from own segment
      const result = await tagService.processBatch(TAGS_CAP);

      ctx.body = result;
      ctx.status = 200;
    } catch (err) {
      console.error(err);
      ctx.body = { error: 'Couldn\'t process batch tags' };
      ctx.status = 500;
    }
  },

  async health(ctx) {
    try {
      const { url } = ctx.query;
      
      if (!url) {
        return ctx.badRequest('URL parameter is required');
      }

      // ssrf protection
      let targetUrl: URL;
      try {
        targetUrl = new URL(url as string);
        const allowedHosts = ['localhost', '127.0.0.1', 'keystone.railway.internal'];
        if (!allowedHosts.includes(targetUrl.hostname)) {
          return ctx.forbidden('URL not allowed');
        }
      } catch (error) {
        return ctx.badRequest('Invalid URL format');
      }

      const healthUrl = `${url}/health`;
      const statusUrl = `${url}/health/status`; // Fixed: should be /health/status not /status

      const healthController = new AbortController();
      const statusController = new AbortController();
      
      const healthTimeout = setTimeout(() => healthController.abort(), 5000);
      const statusTimeout = setTimeout(() => statusController.abort(), 5000);

      const [healthResponse, statusResponse] = await Promise.allSettled([
        fetch(healthUrl, { 
          method: 'GET',
          signal: healthController.signal
        }),
        fetch(statusUrl, { 
          method: 'GET',
          signal: statusController.signal
        })
      ]);

      clearTimeout(healthTimeout);
      clearTimeout(statusTimeout);

      let healthData = null;
      let statusData = null;

      if (healthResponse.status === 'fulfilled' && healthResponse.value.ok) {
        healthData = await healthResponse.value.json();
      }

      if (statusResponse.status === 'fulfilled' && statusResponse.value.ok) {
        statusData = await statusResponse.value.text(); // Status endpoint returns plain text
      }

      const combinedData = {
        status: statusData || 'unknown',
        ...healthData,
        timestamp: Date.now()
      };

      return ctx.send(combinedData);

    } catch (error) {
      strapi.log.error('Health proxy error:', error);
      return ctx.internalServerError('Failed to check orchestrator health');
    }
  },

  async delete(ctx) {
    const { documentId } = ctx.request.body.payload;
    const deleter = strapi.plugin('local-updates').service('deleter') as DeleterService;

    try {
      const report = await deleter.deleteSegmentAndRelations(documentId);
      ctx.body = { deleted: report };
      ctx.status = 200;
    } catch (err) {
      console.log(err)
      console.error(err);
      ctx.body = { error: 'Failed to delete documents' };
      ctx.status = 500;
    }
  },
};

export default controller;