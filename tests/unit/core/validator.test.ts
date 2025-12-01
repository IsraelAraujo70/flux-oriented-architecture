import { FluxValidator } from '../../../src/core/validator';

describe('FluxValidator', () => {
  let validator: FluxValidator;

  beforeEach(() => {
    validator = new FluxValidator();
  });

  it('should validate a correct simple flux definition', () => {
    const def = {
      endpoint: '/test',
      method: 'GET',
      flow: [
        { type: 'return', body: 'ok' }
      ]
    };
    const result = validator.validate(def);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should fail if required fields are missing', () => {
    const def = {
      // missing endpoint and method
      flow: []
    };
    const result = validator.validate(def);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should validate action node structure', () => {
    const def = {
      endpoint: '/test',
      method: 'POST',
      flow: [
        { type: 'action', name: 'act1', path: 'some/action' }
      ]
    };
    expect(validator.validate(def).valid).toBe(true);

    const invalid = {
      endpoint: '/test',
      method: 'POST',
      flow: [
        { type: 'action', name: 'act1' } // missing path
      ]
    };
    expect(validator.validate(invalid).valid).toBe(false);
  });

  it('should validate condition node structure', () => {
    const def = {
      endpoint: '/test',
      method: 'GET',
      flow: [
        { 
          type: 'condition', 
          if: '${foo}', 
          then: [{ type: 'return', body: 'yes' }] 
        }
      ]
    };
    expect(validator.validate(def).valid).toBe(true);
  });

  it('should fail on unknown node types', () => {
    const def = {
      endpoint: '/test',
      method: 'GET',
      flow: [
        { type: 'unknown_type', body: 'fail' }
      ]
    };
    const result = validator.validate(def);
    expect(result.valid).toBe(false);
  });
});
