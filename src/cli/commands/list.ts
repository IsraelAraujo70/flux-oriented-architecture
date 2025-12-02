import { Command } from 'commander';
import { FluxLoader } from '../../core/loader';
import { loadConfig } from '../config';

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
