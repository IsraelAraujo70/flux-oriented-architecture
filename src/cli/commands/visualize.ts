import { Command } from 'commander';
import express from 'express';
import path from 'path';
import fs from 'fs/promises';
import { glob } from 'glob';
import { loadConfig } from '../config';
import { validateFluxDefinition } from '../../core/validator';
import { FluxDefinition } from '../../types';

const defaultTemplate = `<!doctype html><html><body><pre>Template not found.</pre></body></html>`;

async function resolveFluxPath(fluxArg: string, fluxRoot: string): Promise<string> {
  const candidates = new Set<string>();
  const normalizedRoot = path.resolve(fluxRoot);

  // Allow explicit paths and names (with/without .json)
  const possible = fluxArg.endsWith('.json') ? [fluxArg] : [fluxArg, `${fluxArg}.json`];

  for (const candidate of possible) {
    candidates.add(path.resolve(process.cwd(), candidate));
    candidates.add(path.resolve(normalizedRoot, candidate));
  }

  for (const candidate of candidates) {
    try {
      await fs.access(candidate);
      return candidate;
    } catch {
      // keep trying
    }
  }

  throw new Error(
    `Flux definition not found for "${fluxArg}". Tried: ${Array.from(candidates).join(', ')}`
  );
}

async function listFluxFiles(fluxRoot: string) {
  const files = await glob(`${path.resolve(fluxRoot)}/**/*.json`, { windowsPathsNoEscape: true });
  if (!files.length) {
    console.log('No flux definitions found.');
    return;
  }
  console.log('Available flux definitions:');
  files.forEach((file) => {
    const rel = path.relative(process.cwd(), file);
    console.log(`- ${rel}`);
  });
}

async function loadTemplate(): Promise<string> {
  const candidates = [
    path.resolve(__dirname, '../templates/visualizer.html'),
    path.resolve(process.cwd(), 'src/cli/templates/visualizer.html')
  ];

  for (const candidate of candidates) {
    try {
      const content = await fs.readFile(candidate, 'utf-8');
      return content;
    } catch {
      // keep trying
    }
  }

  console.warn('Visualizer template not found, falling back to minimal HTML.');
  return defaultTemplate;
}

export function registerVisualizeCommand(program: Command) {
  program
    .command('visualize <flux>')
    .description('Start a local viewer for a flux JSON definition')
    .option('-p, --port <port>', 'Port to listen on', '6969')
    .option('--host <host>', 'Host to bind', '127.0.0.1')
    .option('--list', 'List available flux files and exit')
    .action(async (fluxArg, options) => {
      const config = await loadConfig();
      const fluxRoot = config.paths?.flux || 'src/flux';

      if (options.list) {
        await listFluxFiles(fluxRoot);
        return;
      }

      let fluxPath: string;
      try {
        fluxPath = await resolveFluxPath(fluxArg, fluxRoot);
      } catch (err: any) {
        console.error(err.message || err);
        return;
      }

      let flux: FluxDefinition;
      try {
        const content = await fs.readFile(fluxPath, 'utf-8');
        flux = JSON.parse(content);
      } catch (err) {
        console.error(`Failed to read flux file at ${fluxPath}:`, err);
        return;
      }

      const validation = validateFluxDefinition(flux);
      if (!validation.valid) {
        console.warn('Flux definition has validation issues:');
        validation.errors.forEach((e) => console.warn(`- ${e}`));
      }

      const app = express();
      const htmlTemplate = await loadTemplate();

      app.get('/data', (_req, res) => {
        res.json({
          file: path.relative(process.cwd(), fluxPath),
          flux,
          valid: validation.valid,
          errors: validation.errors
        });
      });

      app.get('/', (_req, res) => {
        res.type('html').send(htmlTemplate);
      });

      const port = Number(options.port) || 6969;
      const host = options.host || '127.0.0.1';

      app
        .listen(port, host, () => {
          console.log(`Flux viewer running at http://${host}:${port}`);
          console.log(`Showing: ${path.relative(process.cwd(), fluxPath)}`);
        })
        .on('error', (err: any) => {
          console.error(`Failed to start server on ${host}:${port}:`, err.message || err);
        });
    });
}
