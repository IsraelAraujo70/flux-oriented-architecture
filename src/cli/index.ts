import { Command } from 'commander';
import { registerDevCommand } from './commands/dev';
import { registerStartCommand } from './commands/start';
import { registerValidateCommand } from './commands/validate';
import { registerListCommand } from './commands/list';

export const program = new Command();

program.name('foa').description('Flux-Oriented Architecture CLI').version('1.0.0');

registerDevCommand(program);
registerStartCommand(program);
registerValidateCommand(program);
registerListCommand(program);

export async function run() {
  await program.parseAsync(process.argv);
}

// Handle direct execution
if (require.main === module) {
  run();
}
