export interface FluxConfig {
  server: {
    port: number;
    host?: string;
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
