import { Command } from 'commander';
import { FluxLoader } from '../../core/loader';
import { FluxConfig } from '../../types';
import path from 'path';
import fs from 'fs/promises';

export function registerValidateCommand(program: Command) {
  program
    .command('validate')
    .description('Validate all flux definitions')
    .action(async () => {
      console.log('Validating flux definitions...');

      // Load config to get paths
      let config: FluxConfig = {
        server: { port: 3000 },
        paths: { actions: 'src/actions', flux: 'src/flux' }
      };

      try {
        const configPath = path.resolve(process.cwd(), 'foa.config.json');
        const content = await fs.readFile(configPath, 'utf-8');
        config = JSON.parse(content);
      } catch (e) {
        // ignore, use defaults
      }

      const loader = new FluxLoader(config);
      const definitions = await loader.loadFluxDefinitions();
      const errors = loader.getFluxErrors();

      if (errors.length) {
        console.error('Invalid flux definitions found:');
        errors.forEach((err) => {
          console.error(`- ${err.file}: ${err.errors.join(', ')}`);
        });
      }

      if (definitions.length === 0) {
        console.warn('No valid flux definitions found (or directory empty).');
      } else {
        console.log(`Successfully validated ${definitions.length} flux definitions.`);
      }

      if (errors.length) {
        process.exit(1);
      }
    });
}
