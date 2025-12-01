# API Reference

## FluxContext

The `FluxContext` object is passed to every action function.

```typescript
export interface FluxContext {
  req: Request;           // Express request object
  res: Response;          // Express response object
  input: any;             // Merged body, query, and params
  results: Record<string, any>; // Results of all executed actions
  state: Record<string, any>;   // Shared state for the request
  args?: Record<string, any>;   // Arguments specific to the current action
  [key: string]: any;     // Dynamic properties (plugins)
}
```

## Action Function

An action is a simple function that receives the context and returns data.

```typescript
import { FluxContext } from 'flux-oriented-architecture';

export default async function myAction(context: FluxContext) {
  const { name } = context.args;
  return { message: `Hello ${name}` };
}
```

## Configuration (foa.config.json)

```json
{
  "server": {
    "port": 3000
  },
  "paths": {
    "actions": "src/actions",
    "flux": "src/flux"
  },
  "logging": {
    "level": "info"
  }
}
```
