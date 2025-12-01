import { FluxLoader } from '../../../src/core/loader';
import { FluxValidator } from '../../../src/core/validator';
import * as fs from 'fs/promises';
import * as glob from 'glob';

jest.mock('fs/promises');
jest.mock('glob');

// Mock config
const mockConfig = {
  server: { port: 3000 },
  paths: { actions: 'actions', flux: 'flux' },
  logging: { level: 'error' as const }
};

describe('FluxLoader', () => {
  let loader: FluxLoader;

  beforeEach(() => {
    loader = new FluxLoader(mockConfig);
    jest.clearAllMocks();
  });

  it('should load flux definitions correctly', async () => {
    (fs.access as jest.Mock).mockResolvedValue(undefined);
    (glob.glob as unknown as jest.Mock).mockResolvedValue(['flux/test.json']);
    
    const validFlux = {
      endpoint: '/test',
      method: 'GET',
      flow: [{ type: 'return', body: 'ok' }]
    };

    (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify(validFlux));

    const definitions = await loader.loadFluxDefinitions();
    
    expect(definitions).toHaveLength(1);
    expect(definitions[0]).toEqual(validFlux);
    expect(loader.getFluxErrors()).toHaveLength(0);
  });

  it('should handle invalid flux definitions', async () => {
    (fs.access as jest.Mock).mockResolvedValue(undefined);
    (glob.glob as unknown as jest.Mock).mockResolvedValue(['flux/invalid.json']);
    
    const invalidFlux = {
      // missing fields
      flow: []
    };

    (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify(invalidFlux));

    const definitions = await loader.loadFluxDefinitions();
    
    expect(definitions).toHaveLength(0);
    expect(loader.getFluxErrors()).toHaveLength(1);
    expect(loader.getFluxErrors()[0].file).toBe('flux/invalid.json');
  });

  it('should return empty if directory does not exist', async () => {
    (fs.access as jest.Mock).mockRejectedValue(new Error('Not found'));
    const definitions = await loader.loadFluxDefinitions();
    expect(definitions).toEqual([]);
  });
});
