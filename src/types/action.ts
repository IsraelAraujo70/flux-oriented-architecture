import { FluxContext } from './context';

export type ActionFunction = (context: FluxContext) => Promise<any> | any;

export interface ActionDefinition {
  name: string;
  description?: string;
  handler: ActionFunction;
}
