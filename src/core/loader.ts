import { glob } from 'glob';
import path from 'path';
import fs from 'fs/promises';
import { FluxConfig, ActionFunction, FluxDefinition } from '../types';
import { FluxValidator } from './validator';

export class FluxLoader {
  private actions: Map<string, ActionFunction> = new Map();
  private config: FluxConfig;
  private validator: FluxValidator;
  private fluxErrors: { file: string; errors: string[] }[] = [];
  private tsNodeRegistered = false;

  constructor(config: FluxConfig) {
    this.config = config;
    this.validator = new FluxValidator();
  }

  private ensureTsNode() {
    if (this.tsNodeRegistered) return;
    try {
      // Load ts-node in transpile-only mode to allow .ts user actions without prebuild
      // Optional dependency for consumers; fail silently if not present.
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require('ts-node/register/transpile-only');
      this.tsNodeRegistered = true;
    } catch (_err) {
      console.warn(
        'ts-node not found; TypeScript actions may fail to load. Install ts-node to enable.'
      );
      this.tsNodeRegistered = true; // avoid spamming
    }
  }

  async loadActions(): Promise<Map<string, ActionFunction>> {
    const actionsPath = path.resolve(process.cwd(), this.config.paths.actions);
    this.actions.clear();

    // Ensure directory exists
    try {
      await fs.access(actionsPath);
    } catch {
      console.warn(`Actions directory not found: ${actionsPath}`);
      return this.actions;
    }

    const files = await glob(`${actionsPath}/**/*.{ts,js}`, { windowsPathsNoEscape: true });

    for (const file of files) {
      const isTs = file.endsWith('.ts');
      if (isTs) {
        this.ensureTsNode();
      }

      // Convert absolute path to relative path from actions root
      // e.g. /app/src/actions/users/create.ts -> users/create.ts
      // then remove extension -> users/create
      const relativePath = path.relative(actionsPath, file);
      const actionKey = relativePath.replace(/\\/g, '/').replace(/\.(ts|js)$/, '');

      try {
        // Dynamic import
        const module = await import(file);
        const actionFunction = module.default || module;

        if (typeof actionFunction === 'function') {
          this.actions.set(actionKey, actionFunction);
        } else {
          console.warn(`File ${file} does not export a function`);
        }
      } catch (error) {
        console.error(`Error loading action ${file}:`, error);
      }
    }

    return this.actions;
  }

  async loadFluxDefinitions(): Promise<FluxDefinition[]> {
    const fluxPath = path.resolve(process.cwd(), this.config.paths.flux);
    this.fluxErrors = [];

    try {
      await fs.access(fluxPath);
    } catch {
      console.warn(`Flux directory not found: ${fluxPath}`);
      return [];
    }

    const files = await glob(`${fluxPath}/**/*.json`, { windowsPathsNoEscape: true });

    const definitions: FluxDefinition[] = [];
    for (const file of files) {
      try {
        const content = await fs.readFile(file, 'utf-8');
        const definition = JSON.parse(content);

        const validation = this.validator.validate(definition);
        if (validation.valid) {
          definitions.push(definition);
        } else {
          const errors = validation.errors;
          this.fluxErrors.push({ file, errors });
          console.error(`Invalid flux definition in ${file}:`, errors);
        }
      } catch (error) {
        this.fluxErrors.push({ file, errors: [String(error)] });
        console.error(`Error loading flux definition ${file}:`, error);
      }
    }

    return definitions;
  }

  getAction(path: string): ActionFunction | undefined {
    return this.actions.get(path);
  }

  getFluxErrors() {
    return this.fluxErrors;
  }
}
