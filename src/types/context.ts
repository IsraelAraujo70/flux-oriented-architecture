import { Request, Response } from 'express';

export interface FluxContext {
  req: Request;
  res: Response;
  input: any; // Initial input (usually req.body, req.query, or req.params)
  results: Record<string, any>; // Results of previous actions keyed by action name or node name
  state: Record<string, any>; // Shared state across the flow
  plugins: Record<string, any>; // Loaded plugins (db, cache, etc)
  args?: Record<string, any>; // Resolved args for the current action
  [key: string]: any; // Allow dynamic properties for plugins
}
