import { PostgresPlugin } from '../../../src/plugins/database/postgres';
import { Pool } from 'pg';

// Mock pg
jest.mock('pg', () => {
  const mPool = {
    connect: jest.fn(),
    query: jest.fn(),
    end: jest.fn(),
    on: jest.fn()
  };
  return { Pool: jest.fn(() => mPool) };
});

describe('PostgresPlugin', () => {
  let plugin: PostgresPlugin;
  let mockPool: any;

  beforeEach(() => {
    jest.clearAllMocks();
    plugin = new PostgresPlugin();
    // Access the mock instance
    mockPool = new Pool();
  });

  it('should have the correct name', () => {
    expect(plugin.name).toBe('db');
  });

  it('should setup connection pool successfully', async () => {
    mockPool.connect.mockResolvedValue({ release: jest.fn() });

    await plugin.setup({ connectionString: 'postgres://localhost:5432/db' });

    expect(Pool).toHaveBeenCalledWith(
      expect.objectContaining({
        connectionString: 'postgres://localhost:5432/db'
      })
    );
    expect(mockPool.connect).toHaveBeenCalled();
  });

  it('should warn and return if no connection string provided', async () => {
    (Pool as unknown as jest.Mock).mockClear();

    await plugin.setup({}); // Empty config

    expect(Pool).not.toHaveBeenCalled();
  });

  it('should throw error if connection fails during setup', async () => {
    const error = new Error('Connection refused');
    mockPool.connect.mockRejectedValue(error);

    await expect(plugin.setup({ connectionString: 'bad_url' })).rejects.toThrow(
      'Connection refused'
    );
  });

  it('should teardown connection pool', async () => {
    mockPool.connect.mockResolvedValue({ release: jest.fn() });
    await plugin.setup({ connectionString: 'ok' });

    await plugin.teardown();

    expect(mockPool.end).toHaveBeenCalled();
  });

  it('should return client interface with query method', async () => {
    mockPool.connect.mockResolvedValue({ release: jest.fn() });
    await plugin.setup({ connectionString: 'ok' });

    const client = plugin.getClient();

    expect(client).toHaveProperty('pool');
    expect(client).toHaveProperty('query');

    // Test query wrapper
    mockPool.query.mockResolvedValue({ rows: [] });
    await client.query('SELECT 1');
    expect(mockPool.query).toHaveBeenCalledWith('SELECT 1', undefined);
  });

  it('should throw if getClient is called before setup', () => {
    expect(() => plugin.getClient()).toThrow('Database not initialized');
  });
});
