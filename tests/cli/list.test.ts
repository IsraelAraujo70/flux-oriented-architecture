import { Command } from 'commander';
import { registerListCommand } from '../../src/cli/commands/list';
import { FluxLoader } from '../../src/core/loader';
import fs from 'fs/promises';

jest.mock('../../src/core/loader');
jest.mock('fs/promises');

describe('List Command', () => {
  let program: Command;
  let mockLoader: any;
  let exitSpy: jest.SpyInstance;

  beforeEach(() => {
    program = new Command();
    mockLoader = {
      loadFluxDefinitions: jest.fn().mockResolvedValue([]),
      getFluxErrors: jest.fn().mockReturnValue([])
    };
    (FluxLoader as jest.Mock).mockImplementation(() => mockLoader);
    (fs.readFile as jest.Mock).mockRejectedValue(new Error('No config'));

    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    // @ts-ignore
    exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should register list command', () => {
    registerListCommand(program);
    const cmd = program.commands.find(c => c.name() === 'list');
    expect(cmd).toBeDefined();
  });

  it('should list endpoints', async () => {
    mockLoader.loadFluxDefinitions.mockResolvedValue([
      { method: 'GET', endpoint: '/users', description: 'Get users' }
    ]);

    registerListCommand(program);
    await program.parseAsync(['node', 'test', 'list']);

    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('GET    /users - Get users'));
    expect(exitSpy).not.toHaveBeenCalled();
  });

  it('should handle errors and invalid definitions', async () => {
    mockLoader.loadFluxDefinitions.mockResolvedValue([]);
    mockLoader.getFluxErrors.mockReturnValue([{ file: 'bad.json', errors: ['err'] }]);

    registerListCommand(program);
    await program.parseAsync(['node', 'test', 'list']);

    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('Some flux definitions are invalid'));
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
