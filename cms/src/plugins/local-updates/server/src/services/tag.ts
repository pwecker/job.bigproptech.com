import type { Core } from '@strapi/strapi';
import axios from 'axios';

type UnTaggedData = {
  id: number;
  documentId: string;
  job_employment_type: string;
  job_description: string;
  job_is_remote: boolean;
  job_highlights: any;
}

interface HeuristResponseChoice {
  index: number
  message: {
    role: string
    content: string
    finish_reason: string
  }
}

interface HeuristResponseData {
  id: string
  object: string
  created: number
  model: string
  choices: HeuristResponseChoice[]
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

interface Tag {
  category: string
  value: string
  quantifier?: string
}

interface NewTagDoc extends Tag {
  datum: { connect: string }
}

export interface TagServiceReturn {
  getTagSchemaEnums(): Promise<{ categories: string[], quantifiers: string[] }>
  getUntaggedItem(): Promise<UnTaggedData | null>
  generateTagExtractPrompt(categories: string[], qualifications: string[], data: UnTaggedData): string
  postToExtractTags(prompt: string): Promise<HeuristResponseData>
  extractJsonArray(response: string): Tag[]
  isValidTag(tag: Tag, categories: string[], quantifiers: string[]): boolean
  createTagDoc(doc: NewTagDoc): Promise<void>
  processSingleItem(item?: UnTaggedData): Promise<{ usage: any, processed: number, docId?: string }>
  processBatch(limit: number): Promise<{ usage: any, processed: number, cap: number }>
}

const tagService = ({ strapi }: { strapi: Core.Strapi }): TagServiceReturn => {
  async function getTagSchemaEnums() {
    try {
      const tagSchema = strapi.getModel('api::tag.tag');

      const isEnumAttribute = (attr: any): attr is { type: 'enumeration'; enum: string[] } => {
        return attr && attr.type === 'enumeration' && Array.isArray(attr.enum);
      };

      const categoryAttr = tagSchema.attributes.category;
      const quantifierAttr = tagSchema.attributes.quantifier;

      const categories = isEnumAttribute(categoryAttr) ? categoryAttr.enum : [];
      const quantifiers = isEnumAttribute(quantifierAttr) ? quantifierAttr.enum : [];

      return { categories, quantifiers };
    } catch (err) {
      strapi.log.error('Error fetching tag schema:', err);
      return {
        categories: [],
        quantifiers: []
      };
    }
  }

  async function getUntaggedItem() {
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

    try {
      const untaggedData = await strapi.documents('api::data.data').findFirst({
        filters: {
          tags: {
            $null: true
          },
          job_posted_at_datetime_utc: {
            $gte: fiveDaysAgo.toISOString(),
          }
        },
        fields: ['id', 'documentId', 'job_employment_type', 'job_description', 'job_is_remote', 'job_highlights'],
      })

      if (!untaggedData) {
        return null;
      }
  
      return untaggedData as UnTaggedData;
    } catch (err) {
      strapi.log.error(`Couldn't get Strapi document: ${err.message}`);
      return null;
    }
  }

  function generateTagExtractPrompt(
    categories: string[],
    quantifiers: string[],
    data: UnTaggedData
  ) {
    const jobText = `
    Employment Type: ${data.job_employment_type}
    Remote: ${data.job_is_remote ? 'yes' : 'no'}
    Description: ${data.job_description}
    Highlights: ${JSON.stringify(data.job_highlights)}
      `.trim();
  
    return `TASK: Extract requirements from the job listing.  
    CATEGORIES: ${categories.join(', ')}  
    QUANTIFIERS: ${quantifiers.join(', ')}  
    - required = must/essential  
    - preferred = desired/ideal  
    - suggested = familiarity/nice  
    
    VALUES: lowercase, concise, single words. Focus on skills/tech/education, not years.  
    
    RULES:  
    - Quantifier is OPTIONAL.  
    - Use quantifier only for skills, experience, education.  
    - Do NOT use quantifier for benefits, perks, work arrangements.  
    
    OUTPUT: JSON, e.g.  
    [{"category":"framework","value":"react","quantifier":"required"},  
    {"category":"benefits","value":"401k"}]  
    
    JOB LISTING:  
    ${jobText}`;
  }

  async function postToExtractTags(prompt: string) {
    try {
      const response = await axios.post(
        'https://llm-gateway.heurist.xyz/v1/chat/completions',
        {
          model: 'openai/gpt-5-mini',
          messages: [
            {
              role: 'system',
              content: prompt,
            },
          ],
          max_tokens: 5000,
          temperature: 0.5,
          stream: false,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.HEURIST_API_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw new Error(
          `Heurist API error: ${error.response.status} ${error.response.statusText} - ${JSON.stringify(error.response.data)}`
        );
      }
      throw new Error(`Heurist API request failed: ${error.message}`);
    }
  }

  function extractJsonArray(response: string) {
    if (!response || typeof response !== 'string') return [];

    try {
      const start = response.indexOf('[');
      const end = response.lastIndexOf(']');

      if (start === -1 || end === -1 || end <= start) {
        return [];
      }

      const jsonSubstring = response.slice(start, end + 1);
      const parsed = JSON.parse(jsonSubstring);
      if (Array.isArray(parsed) && parsed.every(item => typeof item === 'object')) {
        return parsed;
      }

      return [];
    } catch (err) {
      console.error('Failed to parse LLM JSON output:', err);
      return [];
    }
  }

  function isValidTag(tag: Tag, categories: string[], quantifiers: string[]) {
    if (!categories.includes(tag.category)) {
      return false;
    }

    if (tag.quantifier && !quantifiers.includes(tag.quantifier)) {
      return false;
    }
  
    return true;
  }

  async function createTagDoc(newDoc: NewTagDoc) {
    try {
      const newTagDoc = await strapi
        .documents('api::tag.tag')
        .create({
          data: { ...newDoc },
          status: 'published',
          populate: {
            datum: {
              fields: ['documentId']
            }
          }
        });

      if (!newTagDoc) {
        return;
      }
  
      return;
    } catch (err) {
      console.log(err)
      strapi.log.error(`Couldn't create Strapi document: ${err.message}`);
      return;
    }
  }

  async function processSingleItem(item?: UnTaggedData) {
    const { categories, quantifiers } = await getTagSchemaEnums();

    const untaggedItem = item ?? await getUntaggedItem();
    if (!untaggedItem) {
      return { usage: null, processed: 0 };
    }

    const prompt = generateTagExtractPrompt(categories, quantifiers, untaggedItem);
    const response = await postToExtractTags(prompt);

    const tags = extractJsonArray(response.choices[0].message.content);
    if (tags.length === 0) {
      throw new Error('Could not extract tags from LLM response');
    }

    for (const tag of tags) {
      try {
        if (isValidTag(tag, categories, quantifiers)) {
          await createTagDoc({
            ...tag,
            datum: { connect: untaggedItem.documentId },
          });
        }
      } catch (err) {
        strapi.log.error('Failed to persist tag', tag, err);
      }
    }

    return { usage: response.usage, processed: 1, docId: untaggedItem.documentId };
  }

  async function processBatch(limit: number) {
    let totalUsage = { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
    let processedCount = 0;
    let untaggedItem: UnTaggedData | null;

    while (processedCount < limit && (untaggedItem = await getUntaggedItem())) {
      try {
        const result = await processSingleItem(untaggedItem);
        processedCount += result.processed;

        if (result.usage) {
          totalUsage.prompt_tokens += result.usage.prompt_tokens ?? 0;
          totalUsage.completion_tokens += result.usage.completion_tokens ?? 0;
          totalUsage.total_tokens += result.usage.total_tokens ?? 0;
        }
      } catch (err) {
        strapi.log.error('Failed processing item', untaggedItem?.documentId, err);
      }
    }
    
    return { processed: processedCount, usage: totalUsage, cap: limit };
  }

  return {
    getTagSchemaEnums,
    getUntaggedItem,
    generateTagExtractPrompt,
    postToExtractTags,
    extractJsonArray,
    isValidTag,
    createTagDoc,
    processSingleItem,
    processBatch
  }
}

export default tagService;