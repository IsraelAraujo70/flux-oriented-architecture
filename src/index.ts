import { FluxContext } from './types';
import { FluxServer } from './core/server';

// Exports principais
export { FluxServer } from './core/server';
export { FluxLoader } from './core/loader';
export { FluxExecutor } from './core/executor';
export { FluxValidator, validateFluxDefinition } from './core/validator';
export { Environment, getEnvironment, resolveEnvVariables } from './core/environment';

// Utils
export * from './utils';

export function createFluxServer(configPath?: string) {
  return new FluxServer(configPath);
}

// Types
export type {
  ActionFunction,
  FluxContext,
  FluxConfig,
  FluxDefinition,
  FlowNode,
  ActionNode,
  ConditionNode,
  ForEachNode,
  ParallelNode,
  TryNode,
  ReturnNode
} from './types';

// Helper to create typed actions
export function createAction(handler: (context: FluxContext) => Promise<any> | any) {
  return handler;
}
