import type { Core } from '@strapi/strapi';
import { MongoClient } from 'mongodb';
import { get as _get } from 'lodash';

import type { Public } from '@strapi/strapi';

interface SyncMapCollection {
  source: string
  subset: string
  target: keyof Public.ContentTypeSchemas
}

interface SyncMap {
  key: Record<string, string>,
  fields: Record<string, any>,
  collection: SyncMapCollection
}

interface SyncSegment {
  documentId: string
  map: SyncMap
}

interface SyncReturn {
  processed: number
  skipped: number
}

export interface SyncService {
  syncFromSource(segment : SyncSegment): Promise<SyncReturn>
}

const syncService = ({ strapi }: { strapi: Core.Strapi }): SyncService => {
  async function connectMongo() {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/nest';
    const client = new MongoClient(uri);
    await client.connect();
    return client;
  }

  function resolveMapping(mapping: any, mongoDoc: any): any {
    if (typeof mapping === "string") {
      // Case 1: direct path lookup
      return _get(mongoDoc, mapping);
    }
  
    if (Array.isArray(mapping)) {
      // Case 2: concatenate array of literals + paths
      return mapping
        .map((part) => {
          if (typeof part === "string" && part.includes(".")) {
            return _get(mongoDoc, part) ?? "";
          }
          return part; // literal
        })
        .join("");
    }
  
    if (typeof mapping === "object" && mapping !== null) {
      // Case 3: recursively resolve object mappings
      const obj: Record<string, any> = {};
      for (const [key, subMapping] of Object.entries(mapping)) {
        obj[key] = resolveMapping(subMapping, mongoDoc);
      }
      return obj;
    }
  
    // Fallback
    return mapping;
  }

  async function createOrUpdateByMapping(documentId: string, map: SyncMap, mongoDoc: any) {
    const { collection, key, fields } = map;
    
    const mappedData: Record<string, any> = {};

    for (const [strapiField, mapping] of Object.entries(fields)) {
      mappedData[strapiField] = resolveMapping(mapping, mongoDoc);
    }

    mappedData.segments = { connect: documentId };
  
    const uniqueFilters = {};
    for (const [uniqueField, mongoPath] of Object.entries(key)) {
      const value = _get(mongoDoc, mongoPath as string);
      if (!value) throw new Error(`Missing unique field "${uniqueField}" at path ${mongoPath}`);
      uniqueFilters[uniqueField] = value;
    }
  
    const { target } = collection;
  
    try {
      const existing = await strapi.documents(collection.target).findFirst({
        filters: uniqueFilters
      });
  
      if (existing) {
        return await strapi.documents(target).update({
          documentId: existing.documentId,
          data: mappedData,
          status: 'published'
        })
      } else {
        return await strapi.documents(target).create({
          data: mappedData,
          status: 'published'
        })
      }
    } catch (error) {
      if (error.name === 'ValidationError') {
        console.warn(`Validation failed for document, skipping: ${error.message}`);
        return null; // Return null to indicate this document was skipped
      }
      throw error; // Re-throw other errors
    }
  }

  return {
    async syncFromSource({ documentId, map }: SyncSegment): Promise<SyncReturn> {
      // todo: interface for segment doc map
      const { collection } = map;
      if (!collection || !collection.source || !collection.subset || !collection.target) {
        throw new Error('Invalid segmentMapping: missing collection keys');
      }
    
      const client = await connectMongo();
      try {
        const db = client.db();
        const sourceColl = db.collection(collection.source);
        const cursor = sourceColl.find({ [collection.subset]: { $exists: true } });
    
        let processed = 0;
        let skipped = 0;
    
        for await (const doc of cursor) {
          const result = await createOrUpdateByMapping(documentId, map, doc);
          if (result === null) {
            skipped++;
          } else {
            processed++;
          }
        }
    
        return { processed, skipped };
      } finally {
        await client.close();
      }
    }
  };
};

export default syncService as Core.Service;