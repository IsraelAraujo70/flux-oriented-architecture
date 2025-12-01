import Ajv from 'ajv';
import { FluxDefinition } from '../types';

export class FluxValidator {
  private ajv: Ajv;
  private schema: any;

  constructor() {
    this.ajv = new Ajv({ allErrors: true });
    this.schema = {
      type: 'object',
      properties: {
        endpoint: { type: 'string' },
        method: { type: 'string', enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'] },
        description: { type: 'string' },
        flow: {
          type: 'array',
          items: { $ref: '#/definitions/flowNode' }
        }
      },
      required: ['endpoint', 'method', 'flow'],
      definitions: {
        flowNode: {
          type: 'object',
          oneOf: [
            { $ref: '#/definitions/actionNode' },
            { $ref: '#/definitions/conditionNode' },
            { $ref: '#/definitions/forEachNode' },
            { $ref: '#/definitions/parallelNode' },
            { $ref: '#/definitions/tryNode' },
            { $ref: '#/definitions/returnNode' }
          ]
        },
        actionNode: {
          type: 'object',
          properties: {
            type: { const: 'action' },
            name: { type: 'string' },
            path: { type: 'string' },
            args: { type: 'object' }
          },
          required: ['type', 'name', 'path']
        },
        conditionNode: {
          type: 'object',
          properties: {
            type: { const: 'condition' },
            if: { type: 'string' },
            then: { type: 'array', items: { $ref: '#/definitions/flowNode' } },
            else: { type: 'array', items: { $ref: '#/definitions/flowNode' } }
          },
          required: ['type', 'if', 'then']
        },
        forEachNode: {
          type: 'object',
          properties: {
            type: { const: 'forEach' },
            items: { type: 'string' },
            as: { type: 'string' },
            do: { type: 'array', items: { $ref: '#/definitions/flowNode' } }
          },
          required: ['type', 'items', 'as', 'do']
        },
        parallelNode: {
          type: 'object',
          properties: {
            type: { const: 'parallel' },
            branches: {
              type: 'array',
              items: {
                type: 'array',
                items: { $ref: '#/definitions/flowNode' }
              }
            }
          },
          required: ['type', 'branches']
        },
        tryNode: {
          type: 'object',
          properties: {
            type: { const: 'try' },
            try: { type: 'array', items: { $ref: '#/definitions/flowNode' } },
            catch: { type: 'array', items: { $ref: '#/definitions/flowNode' } },
            errorVar: { type: 'string' }
          },
          required: ['type', 'try', 'catch']
        },
        returnNode: {
          type: 'object',
          properties: {
            type: { const: 'return' },
            status: { type: 'number' },
            body: { }
          },
          required: ['type', 'body']
        }
      }
    };
  }

  validate(definition: any): { valid: boolean; errors: string[] } {
    const validate = this.ajv.compile(this.schema);
    const valid = validate(definition);
    
    if (!valid) {
      return {
        valid: false,
        errors: validate.errors?.map(e => `${e.instancePath} ${e.message}`) || ['Unknown error']
      };
    }

    return { valid: true, errors: [] };
  }
}

export const validateFluxDefinition = (definition: any) => {
  const validator = new FluxValidator();
  return validator.validate(definition);
};
