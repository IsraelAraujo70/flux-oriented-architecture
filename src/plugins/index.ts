export * from './database/index';
export * from './cache/index';
export * from './email/index';
export * from './auth/index';

import { FluxContext } from '../types';

export interface Plugin {
  name: string;
  install: (context: any) => void;
}

export const registerPlugin = (plugin: Plugin) => {
  console.log(`Registered plugin: ${plugin.name}`);
};

export const usePlugin = (pluginName: string) => {
  // Implementation
};
