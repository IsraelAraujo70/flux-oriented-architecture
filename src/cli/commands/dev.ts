import { Command } from 'commander';
import chokidar from 'chokidar';
import { FluxServer } from '../../core/server';

export function registerDevCommand(program: Command) {
  program
    .command('dev')
    .description('Start development server with hot-reload')
    .option('-p, --port <port>', 'Port to listen on')
    .action(async (options) => {
      console.log('Starting FOA in development mode...');

      const server = new FluxServer();

      await server.start({ port: options.port ? Number(options.port) : undefined });

      // Watch for changes
      const watchPaths = ['src/actions/**/*', 'src/flux/**/*'];
      const watcher = chokidar.watch(watchPaths, {
        ignored: /(^|[\/\\])\../, // ignore dotfiles
        persistent: true,
        ignoreInitial: true
      });

      watcher.on('change', async (path) => {
        console.log(`File changed: ${path}`);
        console.log('Reloading server...');
        try {
          await server.reload();
        } catch (err) {
          console.error('Error reloading server:', err);
        }
      });

      watcher.on('add', async (path) => {
        console.log(`File added: ${path}`);
        await server.reload();
      });

      console.log(`Watching for changes in: ${watchPaths.join(', ')}`);
    });
}
