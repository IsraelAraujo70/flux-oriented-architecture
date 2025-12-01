import { Command } from 'commander';
import { registerValidateCommand } from '../../src/cli/commands/validate';
import { FluxLoader } from '../../src/core/loader';
import fs from 'fs/promises';

jest.mock('../../src/core/loader');
jest.mock('fs/promises');

describe('Validate Command', () => {
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
    (fs.readFile as jest.Mock).mockRejectedValue(new Error('No config')); // Default no config

    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    // @ts-ignore
    exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should register validate command', () => {
    registerValidateCommand(program);
    const cmd = program.commands.find(c => c.name() === 'validate');
    expect(cmd).toBeDefined();
  });

  it('should validate successfully with valid definitions', async () => {
    mockLoader.loadFluxDefinitions.mockResolvedValue([{ endpoint: '/test' }]);
    
    registerValidateCommand(program);
    await program.parseAsync(['node', 'test', 'validate']);

    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Successfully validated 1 flux definitions'));
    expect(exitSpy).not.toHaveBeenCalled();
  });

  it('should fail with invalid definitions', async () => {
    mockLoader.loadFluxDefinitions.mockResolvedValue([]);
    mockLoader.getFluxErrors.mockReturnValue([{ file: 'test.json', errors: ['bad'] }]);
    
    registerValidateCommand(program);
    await program.parseAsync(['node', 'test', 'validate']);

    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Invalid flux definitions found'));
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('should warn if no definitions found', async () => {
    mockLoader.loadFluxDefinitions.mockResolvedValue([]);
    mockLoader.getFluxErrors.mockReturnValue([]);

    registerValidateCommand(program);
    await program.parseAsync(['node', 'test', 'validate']);

    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('No valid flux definitions found'));
    expect(exitSpy).not.toHaveBeenCalled();
  });
});
