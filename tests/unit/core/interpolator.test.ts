import { Interpolator } from '../../../src/core/interpolator';
import { FluxContext } from '../../../src/types';

describe('Interpolator', () => {
  let interpolator: Interpolator;
  let context: FluxContext;

  beforeEach(() => {
    interpolator = new Interpolator();
    context = {
      req: {} as any,
      res: {} as any,
      input: {
        id: 123,
        user: {
          name: 'John Doe',
          email: 'john@example.com',
          active: true
        }
      },
      results: {},
      state: {},
      someValue: 'direct',
      someArray: [1, 2, 3]
    };
  });

  it('should return the expression as is if it is not a string', () => {
    expect(interpolator.resolve(123 as any, context)).toBe(123);
    expect(interpolator.resolve({ foo: 'bar' } as any, context)).toEqual({ foo: 'bar' });
  });

  it('should return the string as is if it contains no interpolation', () => {
    expect(interpolator.resolve('Hello World', context)).toBe('Hello World');
  });

  it('should resolve a simple variable from context', () => {
    expect(interpolator.resolve('${someValue}', context)).toBe('direct');
  });

  it('should resolve nested properties', () => {
    expect(interpolator.resolve('${input.user.name}', context)).toBe('John Doe');
  });

  it('should resolve boolean values correctly (not stringified when full match)', () => {
    expect(interpolator.resolve('${input.user.active}', context)).toBe(true);
  });

  it('should resolve number values correctly (not stringified when full match)', () => {
    expect(interpolator.resolve('${input.id}', context)).toBe(123);
  });

  it('should resolve array values correctly (not stringified when full match)', () => {
    expect(interpolator.resolve('${someArray}', context)).toEqual([1, 2, 3]);
  });

  it('should handle multiple interpolations in a string', () => {
    expect(interpolator.resolve('User: ${input.user.name} (${input.user.email})', context))
      .toBe('User: John Doe (john@example.com)');
  });

  it('should return empty string for undefined values in string interpolation', () => {
    expect(interpolator.resolve('Value: ${nonExistent}', context)).toBe('Value: ');
  });

  it('should return undefined for undefined values in full match', () => {
    expect(interpolator.resolve('${nonExistent}', context)).toBeUndefined();
  });
});
