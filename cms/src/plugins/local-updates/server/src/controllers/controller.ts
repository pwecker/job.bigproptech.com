import type { Core } from '@strapi/strapi';
import { type TagServiceReturn } from '../services'

const controller: Core.Controller = {
  index(ctx) {
    ctx.body = strapi
      .plugin('local-updates')
      .service('service')
      .getWelcomeMessage();
  },

  async sync(ctx) {
    try {
      const sync = strapi.plugin('local-updates').service('sync');
      const segmentMapping = ctx.request.body.payload.map;
  
      const result = await sync.syncFromSource(segmentMapping);
  
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
      const tagService = strapi.plugin('local-updates').service('tag') as TagServiceReturn;
      const { categories, quantifiers } = await tagService.getTagSchemaEnums();

      const untaggedItem = await tagService.getUntaggedItem();
      if (!untaggedItem) {
        ctx.body = { message: 'No untagged items available.' };
        ctx.status = 200;
        return;
      }

      const prompt = tagService.generateTagExtractPrompt(categories, quantifiers, untaggedItem);
      const response = await tagService.postToExtractTags(prompt);

      const tags = tagService.extractJsonArray(response.choices[0].message.content);
      if (tags.length === 0) {
        throw new Error('Couldn\'t extract from LLM response');
      }

      for (const tag of tags) {
        try {
          if (tagService.isValidTag(tag, categories, quantifiers)) {
            await tagService.createTagDoc({
              ...tag,
              datum: { connect: untaggedItem.documentId },
            });
          }
        } catch (tagErr) {
          console.error('Failed to persist tag:', tag, tagErr);
        }
      }

      ctx.body = { usage: response.usage, processed: 1, docId: untaggedItem.documentId };
      ctx.status = 200;
    } catch (err) {
      console.error(err);
      ctx.body = { error: 'Couldn\'t process single tag' };
      ctx.status = 500;
    }
  },

  async tagBatch(ctx) {
    const HARD_CAP = 2;
    try {
      const tagService = strapi.plugin('local-updates').service('tag') as TagServiceReturn;
      const { categories, quantifiers } = await tagService.getTagSchemaEnums();

      let totalUsage = { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
      let processedCount = 0;
      let untaggedItem: any;

      while (processedCount < HARD_CAP && (untaggedItem = await tagService.getUntaggedItem())) {
        try {
          const prompt = tagService.generateTagExtractPrompt(categories, quantifiers, untaggedItem);
          const response = await tagService.postToExtractTags(prompt);

          const tags = tagService.extractJsonArray(response.choices[0].message.content);
          if (tags.length === 0) {
            console.warn('No tags extracted for item:', untaggedItem.documentId);
            continue;
          }

          for (const tag of tags) {
            try {
              if (tagService.isValidTag(tag, categories, quantifiers)) {
                await tagService.createTagDoc({
                  ...tag,
                  datum: { connect: untaggedItem.documentId },
                });
              } else {
                console.warn('Invalid tag skipped:', tag);
              }
            } catch (tagErr) {
              console.error('Failed to persist tag:', tag, tagErr);
            }
          }

          if (response.usage) {
            totalUsage.prompt_tokens += response.usage.prompt_tokens ?? 0;
            totalUsage.completion_tokens += response.usage.completion_tokens ?? 0;
            totalUsage.total_tokens += response.usage.total_tokens ?? 0;
          }
          processedCount++;
        } catch (itemErr) {
          console.error('Failed processing item:', untaggedItem?.documentId, itemErr);
        }
      }

      ctx.body = {
        processed: processedCount,
        usage: totalUsage,
        cap: HARD_CAP,
      };
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
        const allowedHosts = ['localhost', '127.0.0.1'];
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
  }
};

export default controller;