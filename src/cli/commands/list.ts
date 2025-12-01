import { Command } from 'commander';
import path from 'path';
import fs from 'fs/promises';
import { FluxLoader } from '../../core/loader';
import { FluxConfig } from '../../types';

async function loadConfig(): Promise<FluxConfig> {
  let config: FluxConfig = {
    server: { port: 3000 },
    paths: { actions: 'src/actions', flux: 'src/flux' },
    logging: { level: 'info' }
  };

  try {
    const configPath = path.resolve(process.cwd(), 'foa.config.json');
    const content = await fs.readFile(configPath, 'utf-8');
    config = JSON.parse(content);
  } catch {
    // keep defaults
  }

  return config;
}

export function registerListCommand(program: Command) {
  program
    .command('list')
    .description('List all flux endpoints')
    .action(async () => {
      console.log('Listing flux endpoints...');

      const config = await loadConfig();
      const loader = new FluxLoader(config);
      const definitions = await loader.loadFluxDefinitions();
      const errors = loader.getFluxErrors();

      if (errors.length) {
        console.warn('Some flux definitions are invalid:');
        errors.forEach((err) => {
          console.warn(`- ${err.file}: ${err.errors.join(', ')}`);
        });
      }

      if (!definitions.length) {
        console.log('No valid flux definitions found.');
        if (errors.length) {
          process.exit(1);
        }
        return;
      }

      definitions.forEach((def) => {
        const method = def.method.padEnd(6, ' ');
        const desc = def.description ? ` - ${def.description}` : '';
        console.log(`${method} ${def.endpoint}${desc}`);
      });

      if (errors.length) {
        process.exit(1);
      }
    });
}
