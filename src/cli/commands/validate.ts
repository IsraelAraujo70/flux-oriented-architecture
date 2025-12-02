import { Command } from 'commander';
import { FluxLoader } from '../../core/loader';
import { loadConfig } from '../config';

export function registerValidateCommand(program: Command) {
  program
    .command('validate')
    .description('Validate all flux definitions')
    .action(async () => {
      console.log('Validating flux definitions...');

      const loader = new FluxLoader(await loadConfig());
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
