import fs from 'fs/promises';
import path from 'path';
import { FluxConfig } from '../types';

const defaultConfig: FluxConfig = {
  server: { port: 3000 },
  paths: { actions: 'src/actions', flux: 'src/flux' },
  logging: { level: 'info' }
};

export async function loadConfig(): Promise<FluxConfig> {
  const configPath = path.resolve(process.cwd(), 'foa.config.json');

  try {
    const content = await fs.readFile(configPath, 'utf-8');
    return JSON.parse(content);
  } catch {
    return defaultConfig;
  }
}
