import type { Core } from '@strapi/strapi';

export interface DeleterService extends Core.Service {
  deleteSegmentAndRelations(segmentId: string): Promise<{ data: number; tags: number }>;
}

const deleteService = ({ strapi }: { strapi: Core.Strapi }): DeleterService => {

  const deleteDocument = async function (model: string, documentId: string): Promise<boolean> {
    try {
      await strapi.documents(`api::${model}.${model}`).delete({ documentId });
      return true;
    } catch (err) {
      console.log(err)
      return false;
    }
  };

  const deleteSegmentAndRelations: DeleterService['deleteSegmentAndRelations'] = async (documentId) => {
    const report = { data: 0, tags: 0 };

    const segment = await strapi.documents('api::segment.segment').findFirst({
      filters: { documentId },
      fields: ['documentId'],
      populate: {
        data: {
          fields: ['documentId'],
          populate: {
            tags: {
              fields: ['documentId'],
            },
          },
        },
      }
    });

    if (!segment) throw new Error(`Segment not found for documentId: ${documentId}`);

    const dataIds = segment?.data?.map((d: any) => d.documentId) || [];
    const tagIds = segment?.data?.flatMap((d: any) => 
      d.tags?.map((t: any) => t.documentId) || []
    ) || [];

    for (const documentId of dataIds) {
      const bump = await deleteDocument('data', documentId);
      report.data += Number(bump);
    }

    for (const documentId of tagIds) {
      const bump = await deleteDocument('tag', documentId);
      report.tags += Number(bump);
    }

    return report;
  }

  return {
    deleteSegmentAndRelations
  };
}

export default deleteService;