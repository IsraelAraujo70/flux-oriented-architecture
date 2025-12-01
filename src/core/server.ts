import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs/promises';
import { FluxConfig, FluxContext, FluxDefinition } from '../types';
import { FluxLoader } from './loader';
import { FluxExecutor } from './executor';
import { FluxLogger } from './logger';

export class FluxServer {
  private app: express.Application;
  private config!: FluxConfig;
  private loader!: FluxLoader;
  private executor!: FluxExecutor;
  private logger!: FluxLogger;
  private configPath: string;

  constructor(configPath?: string) {
    this.app = express();
    this.app.use(express.json());
    this.configPath = configPath || 'foa.config.json';
  }

  async init() {
    // Load config
    const fullConfigPath = path.resolve(process.cwd(), this.configPath);
    try {
      const configContent = await fs.readFile(fullConfigPath, 'utf-8');
      this.config = JSON.parse(configContent);
    } catch (error) {
      console.error(`Could not load config from ${fullConfigPath}. Using defaults.`);
      this.config = {
        server: { port: 3000 },
        paths: { actions: 'src/actions', flux: 'src/flux' },
        logging: { level: 'info' }
      };
    }

    this.logger = new FluxLogger(this.config.logging);
    this.loader = new FluxLoader(this.config);
    this.executor = new FluxExecutor(this.config, this.loader);
  }

  async start(options?: { port?: number }) {
    if (!this.config) {
      await this.init();
    }

    if (options?.port) {
      this.config.server.port = Number(options.port);
    }

    // 1. Load actions
    this.logger.info('Loading actions...');
    await this.loader.loadActions();

    // 2. Load and register flux definitions
    this.logger.info('Loading flux definitions...');
    const fluxDefinitions = await this.loader.loadFluxDefinitions();

    for (const flux of fluxDefinitions) {
      this.registerEndpoint(flux);
    }

    // 3. Start server
    const port = this.config.server.port || 3000;
    this.app.listen(port, () => {
      this.logger.info(`FOA server listening on port ${port}`);
    });
  }

  private registerEndpoint(flux: FluxDefinition) {
    const method = flux.method.toLowerCase() as 'get' | 'post' | 'put' | 'delete' | 'patch' | 'options' | 'head';
    
    this.app[method](flux.endpoint, async (req: Request, res: Response) => {
      const context: FluxContext = {
        req,
        res,
        input: { ...req.body, ...req.query, ...req.params },
        results: {},
        state: {}
      };

      await this.executor.executeFlux(flux, context);
    });

    this.logger.info(`Registered ${flux.method} ${flux.endpoint}`);
  }

  // For dev mode: reload everything
  async reload() {
    this.logger.info('Reloading configuration and routes...');
    // In a real scenario, we might need to close the server and restart, 
    // or just clear the router stack.
    // Express doesn't make it super easy to unregister routes.
    // For simplicity in this prototype, we'll just re-load actions/flux
    // Note: This won't clear old routes in Express effectively without more logic.
    // A better approach for dev/hot-reload is to use a router that we replace.
    
    // Re-load loader
    await this.loader.loadActions();
    const definitions = await this.loader.loadFluxDefinitions();
    
    // NOTE: This simple reload appends routes, it doesn't replace them.
    // A full restart is usually better for structural changes.
    // But let's at least re-register.
    for (const flux of definitions) {
       // In a real hot-reload implementation, we'd swap the router.
       // For now, we just log that we re-scanned.
    }
    this.logger.info('Reload complete (Note: Route changes may require restart)');
  }
}
