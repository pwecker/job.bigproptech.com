import type { Core } from '@strapi/strapi';
import { MongoClient } from 'mongodb';
import { get as _get } from 'lodash';

const syncService = ({ strapi }: { strapi: Core.Strapi }) => {
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

  return {
    async createOrUpdateByMapping(segmentMapping: any, mongoDoc: any) {
      const { collection, key, fields } = segmentMapping;
      
      const mappedData: Record<string, any> = {};

      for (const [strapiField, mapping] of Object.entries(fields)) {
        mappedData[strapiField] = resolveMapping(mapping, mongoDoc);
      }
    
      mappedData['status'] = 'published';
    
      const uniqueFilters = {};
      for (const [uniqueField, mongoPath] of Object.entries(key)) {
        const value = _get(mongoDoc, mongoPath as string);
        if (!value) throw new Error(`Missing unique field "${uniqueField}" at path ${mongoPath}`);
        uniqueFilters[uniqueField] = value;
      }
    
      const { target } = collection;
    
      try {
        const existing = await strapi.documents(target).findFirst({
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
    },
    async syncFromSource(segmentMapping: any) {
      const { collection } = segmentMapping;
      if (!collection || !collection.source || !collection.subset || !collection.target) {
        throw new Error('Invalid segmentMapping: missing collection keys');
      }
    
      const client = await connectMongo();
      try {
        const db = client.db();
        const sourceColl = db.collection(collection.source);
    
        // Query all docs where subset exists
        const cursor = sourceColl.find({ [collection.subset]: { $exists: true } });
    
        let processed = 0;
        let skipped = 0;
    
        for await (const doc of cursor) {
          const result = await this.createOrUpdateByMapping(segmentMapping, doc);
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