export type CorsOrigin = string | string[] | boolean;

export interface CorsConfig {
  origin?: CorsOrigin;
  credentials?: boolean;
  methods?: Array<'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS'>;
  allowedHeaders?: string[];
  exposedHeaders?: string[];
  maxAge?: number;
}

export interface FluxConfig {
  server: {
    port: number;
    host?: string;
    cors?: CorsConfig;
  };
  paths: {
    actions: string;
    flux: string;
  };
  logging?: {
    level: 'debug' | 'info' | 'warn' | 'error';
  };
  plugins?: Record<string, any>;
}
