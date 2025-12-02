import { FluxContext } from '../types';

export class Interpolator {
  /**
   * Resolves expressions like "${user.id}" from the context.
   * Supports strings, arrays, and objects (recursively).
   */
  resolve(expression: any, context: FluxContext): any {
    // Handle null/undefined
    if (expression === null || expression === undefined) {
      return expression;
    }

    // Handle arrays - resolve each element
    if (Array.isArray(expression)) {
      return expression.map((item) => this.resolve(item, context));
    }

    // Handle objects - resolve each value recursively
    if (typeof expression === 'object') {
      const result: Record<string, any> = {};
      for (const [key, value] of Object.entries(expression)) {
        result[key] = this.resolve(value, context);
      }
      return result;
    }

    // Handle non-string primitives (numbers, booleans)
    if (typeof expression !== 'string') {
      return expression;
    }

    // Handle strings without interpolation
    if (!expression.includes('${')) {
      return expression;
    }

    // Handle single full expression "${path}" -> return actual value type (not stringified)
    const fullMatch = expression.match(/^\$\{([^}]+)\}$/);
    if (fullMatch) {
      return this.getValueByPath(fullMatch[1], context);
    }

    // Handle string interpolation "Hello ${name}" -> returns string
    return expression.replace(/\$\{([^}]+)\}/g, (match, path) => {
      const value = this.getValueByPath(path, context);
      return value !== undefined && value !== null ? String(value) : '';
    });
  }

  private getValueByPath(path: string, context: FluxContext): any {
    const parts = path.split('.');
    let value: any = context;

    for (const part of parts) {
      if (value === undefined || value === null) {
        return undefined;
      }
      value = value[part];
    }

    return value;
  }

  /**
   * Evaluates a logical expression string with interpolation support.
   * Allows operators like !, &&, ||, ===, !==, >, <, etc.
   * Example: "!${user.isActive} || ${user.age} < 18"
   */
  evaluateCondition(expression: string, context: FluxContext): boolean {
    if (!expression) return false;

    // If it's not a string, treat as truthy/falsy value directly
    if (typeof expression !== 'string') {
      return !!this.resolve(expression, context);
    }

    // 1. Extract all interpolation patterns: ${...}
    const vars: any[] = [];
    const processedExpression = expression.replace(/\$\{([^}]+)\}/g, (match, path) => {
      const value = this.getValueByPath(path, context);
      vars.push(value);
      // Replace with reference to the vars array index
      return `__vars[${vars.length - 1}]`;
    });

    try {
      const evaluator = new Function('__vars', `return (${processedExpression});`);
      return !!evaluator(vars);
    } catch (error) {
      console.warn(`Condition evaluation failed for "${expression}":`, error);
      return !!this.resolve(expression, context);
    }
  }
}
