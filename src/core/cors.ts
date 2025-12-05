import { CorsOptions } from 'cors';
import { CorsConfig } from '../types';

const DEFAULT_METHODS = ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'];

export function buildCorsOptions(corsConfig?: CorsConfig): CorsOptions | undefined {
  if (!corsConfig) return undefined;

  const origin =
    corsConfig.origin !== undefined ? corsConfig.origin : corsConfig.credentials ? true : undefined;

  const methods = corsConfig.methods?.map((method) => method.toUpperCase()) ?? DEFAULT_METHODS;

  const options: CorsOptions = {
    origin,
    credentials: corsConfig.credentials,
    methods,
    allowedHeaders: corsConfig.allowedHeaders,
    exposedHeaders: corsConfig.exposedHeaders,
    maxAge: corsConfig.maxAge
  };

  return options;
}
