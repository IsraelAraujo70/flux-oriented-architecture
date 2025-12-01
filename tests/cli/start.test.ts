import { Command } from 'commander';
import { registerStartCommand } from '../../src/cli/commands/start';
import { FluxServer } from '../../src/core/server';

jest.mock('../../src/core/server');

describe('Start Command', () => {
  let program: Command;
  let mockServer: any;
  let exitSpy: jest.SpyInstance;

  beforeEach(() => {
    program = new Command();
    mockServer = {
      start: jest.fn().mockResolvedValue(undefined)
    };
    (FluxServer as jest.Mock).mockImplementation(() => mockServer);
    
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    // @ts-ignore
    exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should register start command', () => {
    registerStartCommand(program);
    const cmd = program.commands.find(c => c.name() === 'start');
    expect(cmd).toBeDefined();
  });

  it('should start server with default options', async () => {
    registerStartCommand(program);
    await program.parseAsync(['node', 'test', 'start']);

    expect(FluxServer).toHaveBeenCalled();
    expect(mockServer.start).toHaveBeenCalledWith({ port: undefined });
  });

  it('should start server with port option', async () => {
    registerStartCommand(program);
    await program.parseAsync(['node', 'test', 'start', '-p', '5000']);

    expect(mockServer.start).toHaveBeenCalledWith({ port: 5000 });
  });

  it('should handle start error', async () => {
    mockServer.start.mockRejectedValue(new Error('Fail'));
    registerStartCommand(program);
    
    await program.parseAsync(['node', 'test', 'start']);

    expect(console.error).toHaveBeenCalled();
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
