import { Pool, PoolConfig } from 'pg';
import { IPlugin } from '../../core/ports/IPlugin';
import { FluxLogger } from '../../core/logger';

export class PostgresPlugin implements IPlugin {
  name = 'db';
  private pool: Pool | null = null;
  private logger: FluxLogger;

  constructor() {
    this.logger = new FluxLogger();
  }

  async setup(config: any): Promise<void> {
    const dbConfig: PoolConfig = {
      connectionString: config.connectionString || process.env.DATABASE_URL,
      max: config.max || 10,
      idleTimeoutMillis: config.idleTimeoutMillis || 30000,
      connectionTimeoutMillis: config.connectionTimeoutMillis || 2000
    };

    if (!dbConfig.connectionString) {
      this.logger.warn(
        '[PostgresPlugin] No connection string provided. Plugin will not initialize connection.'
      );
      return;
    }

    try {
      this.pool = new Pool(dbConfig);
      // Verify connection
      const client = await this.pool.connect();
      client.release();
      this.logger.info('[PostgresPlugin] Database connected successfully');
    } catch (error) {
      this.logger.error(`[PostgresPlugin] Connection failed: ${(error as Error).message}`);
      throw error;
    }
  }

  async teardown(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.logger.info('[PostgresPlugin] Database connection closed');
    }
  }

  /**
   * Returns a simplified interface or the raw pool.
   * Here we expose the pool, but wrapped with helper methods if needed.
   */
  getClient(): any {
    if (!this.pool) {
      throw new Error('[PostgresPlugin] Database not initialized');
    }
    return {
      // Raw pool access
      pool: this.pool,
      // Helper for simple queries
      query: (text: string, params?: any[]) => this.pool!.query(text, params)
    };
  }
}
