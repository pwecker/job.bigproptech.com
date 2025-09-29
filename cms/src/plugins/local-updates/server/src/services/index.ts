import type { Core } from '@strapi/strapi';
export type { TagServiceReturn } from './tag'
export type { SyncService } from './sync'
import service from './service';
import orchestrator from './orchestrator';
import sync from './sync';
import tag from './tag'

const services: Record<string, Core.Service> = {
  service,
  orchestrator,
  sync,
  tag
};

export default services;
