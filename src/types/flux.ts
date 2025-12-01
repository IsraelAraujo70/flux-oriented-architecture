export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS' | 'HEAD';

export interface FluxDefinition {
  endpoint: string;
  method: HttpMethod;
  description?: string;
  flow: FlowNode[];
}

export type FlowNode =
  | ActionNode
  | ConditionNode
  | ForEachNode
  | ParallelNode
  | TryNode
  | ReturnNode;

export interface ActionNode {
  type: 'action';
  name: string; // Unique name in the flow to store result
  path: string; // Path to the action file (e.g. "user/create")
  args?: Record<string, any>; // Arguments to pass to the action (resolved via interpolator)
}

export interface ConditionNode {
  type: 'condition';
  if: string; // Expression to evaluate
  then: FlowNode[];
  else?: FlowNode[];
}

export interface ForEachNode {
  type: 'forEach';
  items: string; // Expression pointing to an array
  as: string; // Variable name for current item
  do: FlowNode[];
}

export interface ParallelNode {
  type: 'parallel';
  branches: FlowNode[][]; // Array of flows to run in parallel
}

export interface TryNode {
  type: 'try';
  try: FlowNode[];
  catch: FlowNode[];
  errorVar?: string; // Variable name to store the error
}

export interface ReturnNode {
  type: 'return';
  status?: number;
  body: any; // Expression or object to return
}
