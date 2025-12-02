import { Interpolator } from '../../src/core/interpolator';
import { FluxContext } from '../../src/types';

describe('Interpolator - Logical Evaluation', () => {
  let interpolator: Interpolator;
  let context: FluxContext;

  beforeEach(() => {
    interpolator = new Interpolator();
    context = {
      req: {} as any,
      res: {} as any,
      input: {
        username: 'admin',
        age: 25,
        role: 'editor',
        isActive: true,
        count: 0
      },
      results: {},
      state: {},
      plugins: {}
    };
  });

  const evaluate = (expr: string) => interpolator.evaluateCondition(expr, context);

  it('should evaluate simple equality (===)', () => {
    expect(evaluate("${input.username} === 'admin'")).toBe(true);
    expect(evaluate("${input.username} === 'guest'")).toBe(false);
  });

  it('should evaluate simple inequality (!==)', () => {
    expect(evaluate("${input.role} !== 'admin'")).toBe(true);
    expect(evaluate("${input.role} !== 'editor'")).toBe(false);
  });

  it('should evaluate logical NOT (!)', () => {
    expect(evaluate('!${input.isActive}')).toBe(false);
    // Testing the scenario mentioned by the user: !${input.username}
    // If username is present (truthy string), !username should be false
    expect(evaluate('!${input.username}')).toBe(false);
  });

  it('should evaluate OR (||) operators', () => {
    expect(evaluate("${input.age} < 18 || ${input.role} === 'editor'")).toBe(true);
    expect(evaluate("${input.age} > 30 || ${input.role} === 'guest'")).toBe(false);
  });

  it('should evaluate AND (&&) operators', () => {
    expect(evaluate('${input.age} > 18 && ${input.isActive}')).toBe(true);
    expect(evaluate('${input.age} > 18 && !${input.isActive}')).toBe(false);
  });

  it('should handle numeric comparisons', () => {
    expect(evaluate('${input.age} >= 25')).toBe(true);
    expect(evaluate('${input.age} < 20')).toBe(false);
  });

  it('should handle falsy values correctly (0 should be false in boolean context but comparable)', () => {
    expect(evaluate('${input.count} === 0')).toBe(true);
  });

  it('should fall back to standard resolution for single variables (truthy/falsy check)', () => {
    // Legacy behavior compatibility
    expect(evaluate('${input.isActive}')).toBe(true);
    expect(evaluate('${input.username}')).toBe(true); // Non-empty string is true
  });

  it('should handle complex expressions with parentheses', () => {
    expect(
      evaluate("(${input.age} > 20 && ${input.role} === 'editor') || ${input.username} === 'root'")
    ).toBe(true);
  });
});
