import { Command } from 'commander';
import { FluxServer } from '../../core/server';

export function registerStartCommand(program: Command) {
  program
    .command('start')
    .description('Start server in production mode')
    .option('-p, --port <port>', 'Port to listen on')
    .action(async (options) => {
      console.log('Starting FOA server...');

      const server = new FluxServer();

      try {
        await server.start({ port: options.port ? Number(options.port) : undefined });
      } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
      }
    });
}
