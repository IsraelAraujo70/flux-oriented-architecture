import { Environment, getEnvironment, resolveEnvVariables } from '../../src/core/environment';
import fs from 'fs';
import path from 'path';

// Mock fs module
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  readFileSync: jest.fn()
}));

describe('Environment', () => {
  let env: Environment;
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset singleton and process.env before each test
    env = Environment.getInstance();
    env.reset();
    process.env = { ...originalEnv };
    jest.clearAllMocks();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = Environment.getInstance();
      const instance2 = Environment.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('load', () => {
    it('should load variables from .env file', () => {
      const envContent = `
DATABASE_URL=postgres://localhost:5432/db
API_KEY=secret123
# This is a comment
PORT=3000
      `;

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue(envContent);

      env.load();

      expect(env.get('DATABASE_URL')).toBe('postgres://localhost:5432/db');
      expect(env.get('API_KEY')).toBe('secret123');
      expect(env.get('PORT')).toBe('3000');
    });

    it('should handle quoted values', () => {
      const envContent = `
DOUBLE_QUOTED="hello world"
SINGLE_QUOTED='hello world'
      `;

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue(envContent);

      env.load();

      expect(env.get('DOUBLE_QUOTED')).toBe('hello world');
      expect(env.get('SINGLE_QUOTED')).toBe('hello world');
    });

    it('should skip empty lines and comments', () => {
      const envContent = `
# Comment line
KEY1=value1

# Another comment
KEY2=value2
      `;

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue(envContent);

      env.load();

      expect(env.get('KEY1')).toBe('value1');
      expect(env.get('KEY2')).toBe('value2');
    });

    it('should prioritize system environment variables', () => {
      process.env.MY_VAR = 'from_system';

      const envContent = 'MY_VAR=from_file';

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue(envContent);

      env.load();

      // System env should override file
      expect(env.get('MY_VAR')).toBe('from_system');
    });

    it('should handle missing .env file gracefully', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      expect(() => env.load()).not.toThrow();
    });

    it('should only load once', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue('KEY=value');

      env.load();
      env.load(); // Second call should be no-op

      expect(fs.readFileSync).toHaveBeenCalledTimes(1);
    });

    it('should accept custom env file path', () => {
      const customPath = '/custom/path/.env.local';

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue('CUSTOM=value');

      env.load(customPath);

      expect(fs.existsSync).toHaveBeenCalledWith(customPath);
    });
  });

  describe('get', () => {
    it('should return undefined for non-existent variable', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      env.load();

      expect(env.get('NON_EXISTENT')).toBeUndefined();
    });

    it('should return default value if provided and variable not found', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      env.load();

      expect(env.get('NON_EXISTENT', 'default')).toBe('default');
    });

    it('should return value from process.env', () => {
      process.env.SYSTEM_VAR = 'system_value';
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      env.load();

      expect(env.get('SYSTEM_VAR')).toBe('system_value');
    });
  });

  describe('has', () => {
    it('should return true for existing variable', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue('EXISTS=yes');

      env.load();

      expect(env.has('EXISTS')).toBe(true);
    });

    it('should return false for non-existent variable', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      env.load();

      expect(env.has('DOES_NOT_EXIST')).toBe(false);
    });

    it('should return true for system environment variable', () => {
      process.env.SYSTEM_CHECK = 'value';
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      env.load();

      expect(env.has('SYSTEM_CHECK')).toBe(true);
    });
  });

  describe('interpolate', () => {
    beforeEach(() => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue(`
DATABASE_URL=postgres://localhost:5432/db
API_KEY=secret123
PORT=3000
      `);
      env.load();
    });

    it('should interpolate single variable', () => {
      const result = env.interpolate('${DATABASE_URL}');
      expect(result).toBe('postgres://localhost:5432/db');
    });

    it('should interpolate multiple variables', () => {
      const result = env.interpolate('Port: ${PORT}, Key: ${API_KEY}');
      expect(result).toBe('Port: 3000, Key: secret123');
    });

    it('should return original string if no variables', () => {
      const result = env.interpolate('no variables here');
      expect(result).toBe('no variables here');
    });

    it('should keep placeholder if variable not found', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const result = env.interpolate('${UNKNOWN_VAR}');

      expect(result).toBe('${UNKNOWN_VAR}');
      expect(consoleSpy).toHaveBeenCalledWith(
        'Environment variable "UNKNOWN_VAR" is not defined'
      );

      consoleSpy.mockRestore();
    });

    it('should return non-string values as-is', () => {
      expect(env.interpolate(123 as any)).toBe(123);
      expect(env.interpolate(null as any)).toBe(null);
      expect(env.interpolate(undefined as any)).toBe(undefined);
    });
  });

  describe('interpolateObject', () => {
    beforeEach(() => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue(`
DATABASE_URL=postgres://localhost:5432/db
PORT=3000
      `);
      env.load();
    });

    it('should interpolate values in object', () => {
      const config = {
        database: {
          url: '${DATABASE_URL}'
        },
        server: {
          port: '${PORT}'
        }
      };

      const result = env.interpolateObject(config);

      expect(result).toEqual({
        database: {
          url: 'postgres://localhost:5432/db'
        },
        server: {
          port: '3000'
        }
      });
    });

    it('should interpolate values in arrays', () => {
      const config = {
        urls: ['${DATABASE_URL}', 'static-url']
      };

      const result = env.interpolateObject(config);

      expect(result).toEqual({
        urls: ['postgres://localhost:5432/db', 'static-url']
      });
    });

    it('should handle null and undefined', () => {
      expect(env.interpolateObject(null)).toBe(null);
      expect(env.interpolateObject(undefined)).toBe(undefined);
    });

    it('should preserve non-string values', () => {
      const config = {
        port: 3000,
        enabled: true,
        url: '${DATABASE_URL}'
      };

      const result = env.interpolateObject(config);

      expect(result).toEqual({
        port: 3000,
        enabled: true,
        url: 'postgres://localhost:5432/db'
      });
    });
  });

  describe('reset', () => {
    it('should clear all loaded variables', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue('KEY=value');

      env.load();
      expect(env.has('KEY')).toBe(true);

      env.reset();
      // After reset, it should be able to load again
      expect(fs.readFileSync).toHaveBeenCalledTimes(1);

      env.load();
      expect(fs.readFileSync).toHaveBeenCalledTimes(2);
    });
  });
});

describe('getEnvironment', () => {
  it('should return the singleton instance', () => {
    const instance = getEnvironment();
    expect(instance).toBe(Environment.getInstance());
  });
});

describe('resolveEnvVariables', () => {
  beforeEach(() => {
    const env = Environment.getInstance();
    env.reset();
    jest.clearAllMocks();
  });

  it('should load env and interpolate config object', () => {
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.readFileSync as jest.Mock).mockReturnValue('DB_URL=postgres://db');

    const config = {
      database: {
        connectionString: '${DB_URL}'
      }
    };

    const result = resolveEnvVariables(config);

    expect(result).toEqual({
      database: {
        connectionString: 'postgres://db'
      }
    });
  });

  it('should accept custom env file path', () => {
    const customPath = '/custom/.env';

    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.readFileSync as jest.Mock).mockReturnValue('KEY=value');

    resolveEnvVariables({ key: '${KEY}' }, customPath);

    expect(fs.existsSync).toHaveBeenCalledWith(customPath);
  });
});
