import fs from 'fs';
import path from 'path';

/**
 * Environment variable loader and interpolator for FOA.
 * Loads variables from .env file and provides interpolation for config strings.
 */
export class Environment {
  private static instance: Environment;
  private variables: Map<string, string> = new Map();
  private loaded = false;

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): Environment {
    if (!Environment.instance) {
      Environment.instance = new Environment();
    }
    return Environment.instance;
  }

  /**
   * Load environment variables from .env file
   * @param envPath - Path to .env file (defaults to .env in cwd)
   */
  load(envPath?: string): void {
    if (this.loaded) return;

    const filePath = envPath || path.resolve(process.cwd(), '.env');

    try {
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        this.parseEnvFile(content);
        console.log(`Loaded environment variables from ${filePath}`);
      }
    } catch (error) {
      console.warn(`Could not load .env file from ${filePath}:`, error);
    }

    // Also load from process.env (system environment variables take precedence)
    for (const [key, value] of Object.entries(process.env)) {
      if (value !== undefined) {
        this.variables.set(key, value);
      }
    }

    this.loaded = true;
  }

  /**
   * Parse .env file content
   */
  private parseEnvFile(content: string): void {
    const lines = content.split('\n');

    for (const line of lines) {
      // Skip empty lines and comments
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) {
        continue;
      }

      // Parse KEY=VALUE format
      const match = trimmed.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        let value = match[2].trim();

        // Remove surrounding quotes if present
        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1);
        }

        this.variables.set(key, value);
        // Also set in process.env for compatibility
        if (process.env[key] === undefined) {
          process.env[key] = value;
        }
      }
    }
  }

  /**
   * Get an environment variable value
   * @param key - Variable name
   * @param defaultValue - Default value if not found
   */
  get(key: string, defaultValue?: string): string | undefined {
    return this.variables.get(key) ?? process.env[key] ?? defaultValue;
  }

  /**
   * Check if a variable exists
   */
  has(key: string): boolean {
    return this.variables.has(key) || process.env[key] !== undefined;
  }

  /**
   * Interpolate environment variables in a string.
   * Replaces ${VAR_NAME} patterns with actual values.
   * @param value - String with ${VAR} placeholders
   * @returns Interpolated string
   */
  interpolate(value: string): string {
    if (typeof value !== 'string') return value;

    // Match ${VAR_NAME} pattern
    const pattern = /\$\{([^}]+)\}/g;

    return value.replace(pattern, (match, varName) => {
      const envValue = this.get(varName);
      if (envValue === undefined) {
        console.warn(`Environment variable "${varName}" is not defined`);
        return match; // Keep original if not found
      }
      return envValue;
    });
  }

  /**
   * Recursively interpolate all string values in an object.
   * Useful for processing entire config objects.
   * @param obj - Object to process
   * @returns New object with interpolated values
   */
  interpolateObject<T>(obj: T): T {
    if (obj === null || obj === undefined) {
      return obj;
    }

    if (typeof obj === 'string') {
      return this.interpolate(obj) as T;
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.interpolateObject(item)) as T;
    }

    if (typeof obj === 'object') {
      const result: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
        result[key] = this.interpolateObject(value);
      }
      return result as T;
    }

    return obj;
  }

  /**
   * Reset the environment (useful for testing)
   */
  reset(): void {
    this.variables.clear();
    this.loaded = false;
  }
}

/**
 * Convenience function to get the Environment singleton
 */
export function getEnvironment(): Environment {
  return Environment.getInstance();
}

/**
 * Convenience function to load and interpolate a config object
 * @param config - Configuration object with ${VAR} placeholders
 * @param envPath - Optional path to .env file
 * @returns Config with interpolated values
 */
export function resolveEnvVariables<T>(config: T, envPath?: string): T {
  const env = getEnvironment();
  env.load(envPath);
  return env.interpolateObject(config);
}
