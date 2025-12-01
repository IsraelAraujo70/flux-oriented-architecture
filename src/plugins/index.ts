
export interface Plugin {
  name: string;
  install: (context: any) => void;
}

export const registerPlugin = (plugin: Plugin) => {
  console.log(`Registered plugin: ${plugin.name}`);
};

export const usePlugin = (_pluginName: string) => {
  // Implementation
};
