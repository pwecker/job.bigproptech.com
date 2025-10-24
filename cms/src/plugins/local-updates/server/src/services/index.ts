import type { Core } from '@strapi/strapi';
export type { TagServiceReturn } from './tag'
export type { SyncService } from './sync'
export type { WorkflowReturn } from './orchestrator'
export type { DeleterService } from './deleter'
import service from './service';
import orchestrator from './orchestrator';
import sync from './sync';
import tag from './tag'
import deleter from './deleter'

const services: Record<string, Core.Service> = {
  service,
  orchestrator,
  sync,
  tag,
  deleter
};

export default services;
