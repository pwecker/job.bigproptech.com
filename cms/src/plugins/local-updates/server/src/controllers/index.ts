import type { Core } from '@strapi/strapi';
import controller from './controller';

const controllers: Record<string, Core.Controller> = {
  controller,
};

export default controllers;