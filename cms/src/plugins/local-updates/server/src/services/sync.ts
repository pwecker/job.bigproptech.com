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

  type Format = 'UTCDATE' | 'NONE'

  function formatValue(value: any, formatType: Format = 'NONE'): any {
    if (value == null) return value;

    const formatStringValue = (str: string): string => {
      if (formatType === 'UTCDATE') {
        const date = new Date(str);
        if (!isNaN(date.getTime())) {
          return date.toISOString();
        }

        const match = str.match(/\b([A-Z][a-z]{2,8}\s+\d{1,2},\s*\d{4})\b/);
        if (match) {
          const extracted = new Date(match[0]);
          if (!isNaN(extracted.getTime())) {
            return str.replace(match[0], extracted.toISOString());
          }
        }
      }

      return str;
    };

    if (typeof value === 'string') {
      return formatStringValue(value);
    }

    if (Array.isArray(value)) {
      return value.map((v) => formatValue(v, formatType));
    }

    if (typeof value === 'object' && value !== null) {
      const obj: Record<string, any> = {};
      for (const [key, v] of Object.entries(value)) {
        obj[key] = formatValue(v, formatType);
      }
      return obj;
    }

    return value;
  }

  function resolveMappingWithFormat(mapping: any, mongoDoc: any): any {
    if (typeof mapping === "string") {

      let formatType: Format = 'NONE';
      let path = mapping;
      
      const split = mapping.split('!');
      if (split.length > 1) {
        formatType = split[0] as Format;
        path = split[1];
      }
      
      const value = _get(mongoDoc, path);
      return formatValue(value, formatType);
    }
  
    if (Array.isArray(mapping)) {
      const result = mapping
        .map((part) => {
          if (typeof part === 'string') {
            let formatType: Format = 'NONE';
            let path = part;

            const split = part.split('!');
            if (split.length > 1) {
              formatType = split[0] as Format;
              path = split[1];
            }

            if (path.includes('.')) {
              const value = _get(mongoDoc, path);
              return formatValue(value, formatType) ?? '';
            }
          }
          return part;
        })
        .join('');
      
      return result;
    }
  
    if (typeof mapping === "object" && mapping !== null) {
      const obj: Record<string, any> = {};
      for (const [key, subMapping] of Object.entries(mapping)) {
        obj[key] = resolveMappingWithFormat(subMapping, mongoDoc);
      }
      return obj;
    }

    return mapping;
  }

  function validate(value: any, def: any): boolean {
    if (!value) return false;
    switch (def.type) {
      case 'string':
        return typeof value === 'string' && value.length <= 255;
      case 'text':
        return typeof value === 'string';
      case 'decimal':
        return typeof value === 'number' && !isNaN(value);
      case 'boolean':
        return typeof value === 'boolean';
      case 'json':
        return typeof value === 'object' && value !== null;
      default:
        return true;
    }
  }

  async function createOrUpdateByMapping(documentId: string, map: SyncMap, mongoDoc: any) {
    const { collection, key, fields } = map;
    
    const mappedData: Record<string, any> = {};
    const schema = strapi.contentTypes[map.collection.target];

    for (const [strapiField, mapping] of Object.entries(fields)) {
      const syncData = resolveMappingWithFormat(mapping, mongoDoc);
      if (validate(syncData, schema.attributes[strapiField])) mappedData[strapiField] = syncData;
      else delete mappedData[strapiField];
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
        console.warn(`Validation failed: ${JSON.stringify(error.details.errors)}`);
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