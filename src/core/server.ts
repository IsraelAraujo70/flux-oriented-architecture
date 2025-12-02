import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs/promises';
import { FluxConfig, FluxContext, FluxDefinition } from '../types';
import { FluxLoader } from './loader';
import { FluxExecutor } from './executor';
import { FluxLogger } from './logger';
import { PostgresPlugin } from '../plugins/database/postgres';
import { IPlugin } from './ports/IPlugin';
import { resolveEnvVariables } from './environment';

export class FluxServer {
  private app: express.Application;
  private config!: FluxConfig;
  private loader!: FluxLoader;
  private executor!: FluxExecutor;
  private logger!: FluxLogger;
  private configPath: string;
  private plugins: Map<string, IPlugin> = new Map();

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
      const rawConfig = JSON.parse(configContent);
      // Resolve environment variables (e.g., ${DATABASE_URL} -> actual value)
      this.config = resolveEnvVariables<FluxConfig>(rawConfig);
    } catch (_error) {
      console.error(`Could not load config from ${fullConfigPath}. Using defaults.`);
      this.config = {
        server: { port: 3000 },
        paths: { actions: 'src/actions', flux: 'src/flux' },
        logging: { level: 'info' }
      };
    }

    this.logger = new FluxLogger(this.config.logging);
    this.loader = new FluxLoader(this.config);

    // Load Plugins
    if (this.config.plugins) {
      for (const [key, pluginConfig] of Object.entries(this.config.plugins)) {
        let plugin: IPlugin | null = null;

        // TODO: Dynamic loading based on plugin registry or package name
        if (key === 'database' && pluginConfig.type === 'postgres') {
          plugin = new PostgresPlugin();
        }

        if (plugin) {
          this.logger.info(`Initializing plugin: ${plugin.name}`);
          await plugin.setup(pluginConfig);
          this.plugins.set(plugin.name, plugin);
        }
      }
    }

    this.executor = new FluxExecutor(this.config, this.loader, this.plugins);
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
    const method = flux.method.toLowerCase() as
      | 'get'
      | 'post'
      | 'put'
      | 'delete'
      | 'patch'
      | 'options'
      | 'head';

    this.app[method](flux.endpoint, async (req: Request, res: Response) => {
      const context: FluxContext = {
        req,
        res,
        input: { ...req.body, ...req.query, ...req.params },
        results: {},
        state: {},
        plugins: {}
      };

      await this.executor.executeFlux(flux, context);
    });

    this.logger.info(`Registered ${flux.method} ${flux.endpoint}`);
  }

  // For dev mode: reload everything
  async reload() {
    this.logger.info('Reloading configuration and routes...');

    // Re-load loader
    await this.loader.loadActions();
    const definitions = await this.loader.loadFluxDefinitions();
    for (const _flux of definitions) {
      //TODO: Implement route replacement logic here
    }
    this.logger.info('Reload complete (Note: Route changes may require restart)');
  }
}
