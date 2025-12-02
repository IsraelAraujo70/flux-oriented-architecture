import {
  FluxDefinition,
  FlowNode,
  FluxContext,
  ActionNode,
  ConditionNode,
  ForEachNode,
  ParallelNode,
  TryNode,
  ReturnNode,
  FluxConfig
} from '../types';
import { Interpolator } from './interpolator';
import { FluxLogger } from './logger';
import { FluxLoader } from './loader';
import { IPlugin } from './ports/IPlugin';

export class FluxExecutor {
  private interpolator: Interpolator;
  private logger: FluxLogger;
  private loader: FluxLoader;
  private plugins: Map<string, IPlugin>;

  constructor(config: FluxConfig, loader: FluxLoader, plugins: Map<string, IPlugin> = new Map()) {
    this.interpolator = new Interpolator();
    this.logger = new FluxLogger(config.logging);
    this.loader = loader;
    this.plugins = plugins;
  }

  async executeFlux(flux: FluxDefinition, context: FluxContext) {
    try {
      // Inject plugins
      context.plugins = {};
      for (const [name, plugin] of this.plugins) {
        context.plugins[name] = plugin.getClient();
      }

      this.logger.info(`Starting flow: ${flux.method} ${flux.endpoint}`);

      for (const node of flux.flow) {
        const shouldReturn = await this.executeNode(node, context);
        if (shouldReturn) {
          break;
        }
        if (context.res.headersSent) {
          break;
        }
      }

      if (!context.res.headersSent) {
        context.res.status(200).send({ success: true });
      }

      this.logger.info(`Flow completed: ${flux.endpoint}`);
    } catch (error) {
      this.logger.error(`Flow error: ${flux.endpoint}`, error);
      if (!context.res.headersSent) {
        context.res.status(500).json({ error: 'Internal server error' });
      }
    }
  }

  private async executeNode(node: FlowNode, context: FluxContext): Promise<boolean> {
    switch (node.type) {
      case 'action':
        await this.executeAction(node, context);
        return false;
      case 'condition':
        await this.executeCondition(node, context);
        return false;
      case 'forEach':
        await this.executeForEach(node, context);
        return false;
      case 'parallel':
        await this.executeParallel(node, context);
        return false;
      case 'try':
        await this.executeTry(node, context);
        return false;
      case 'return':
        await this.executeReturn(node, context);
        return true;
    }
    return false;
  }

  private async executeAction(node: ActionNode, context: FluxContext) {
    const action = this.loader.getAction(node.path);

    if (!action) {
      throw new Error(`Action not found: ${node.path}`);
    }

    this.logger.debug(`Executing action: ${node.name}`);

    // Resolve arguments
    if (node.args) {
      const resolvedArgs: Record<string, any> = {};
      for (const [key, value] of Object.entries(node.args)) {
        resolvedArgs[key] = this.interpolator.resolve(value, context);
      }
      context.args = resolvedArgs;
    } else {
      delete context.args;
    }

    const startTime = Date.now();
    const result = await action(context);
    const duration = Date.now() - startTime;

    this.logger.debug(`Action completed: ${node.name} (${duration}ms)`);

    context.results[node.name] = result;
    context[node.name] = result;
    delete context.args;
  }

  private async executeCondition(node: ConditionNode, context: FluxContext) {
    const condition = this.interpolator.evaluateCondition(node.if, context);
    this.logger.debug(`Condition: ${node.if} = ${condition}`);

    if (condition) {
      for (const n of node.then) {
        if (await this.executeNode(n, context)) return;
      }
    } else if (node.else) {
      for (const n of node.else) {
        if (await this.executeNode(n, context)) return;
      }
    }
  }

  private async executeForEach(node: ForEachNode, context: FluxContext) {
    const items = this.interpolator.resolve(node.items, context);

    if (!Array.isArray(items)) {
      this.logger.warn(`ForEach: ${node.items} is not an array`);
      return;
    }

    for (const item of items) {
      // Inject current item into context
      context[node.as] = item;

      for (const n of node.do) {
        if (await this.executeNode(n, context)) return;
      }
    }

    // Clean up
    delete context[node.as];
  }

  private async executeParallel(node: ParallelNode, context: FluxContext) {
    const promises = node.branches.map(async (branch) => {
      for (const n of branch) {
        if (await this.executeNode(n, context)) return;
      }
    });

    await Promise.all(promises);
  }

  private async executeTry(node: TryNode, context: FluxContext) {
    try {
      for (const n of node.try) {
        if (await this.executeNode(n, context)) return;
      }
    } catch (error) {
      if (node.errorVar) {
        context[node.errorVar] = error;
      }
      for (const n of node.catch) {
        if (await this.executeNode(n, context)) return;
      }
    }
  }

  private async executeReturn(node: ReturnNode, context: FluxContext) {
    const body = node.body ? this.interpolator.resolve(node.body, context) : undefined;
    const status = node.status || 200;

    context.res.status(status).send(body);
  }
}
