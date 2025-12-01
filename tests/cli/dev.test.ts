import { Command } from 'commander';
import { registerDevCommand } from '../../src/cli/commands/dev';
import { FluxServer } from '../../src/core/server';
import chokidar from 'chokidar';

jest.mock('../../src/core/server');
jest.mock('chokidar');

describe('Dev Command', () => {
  let program: Command;
  let mockServer: any;
  let mockWatcher: any;

  beforeEach(() => {
    program = new Command();
    mockServer = {
      start: jest.fn().mockResolvedValue(undefined),
      reload: jest.fn().mockResolvedValue(undefined)
    };
    (FluxServer as jest.Mock).mockImplementation(() => mockServer);

    mockWatcher = {
      on: jest.fn()
    };
    (chokidar.watch as jest.Mock).mockReturnValue(mockWatcher);
    
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should register dev command', () => {
    registerDevCommand(program);
    const cmd = program.commands.find(c => c.name() === 'dev');
    expect(cmd).toBeDefined();
  });

  it('should start server with correct options', async () => {
    registerDevCommand(program);
    await program.parseAsync(['node', 'test', 'dev', '-p', '4000']);

    expect(FluxServer).toHaveBeenCalled();
    expect(mockServer.start).toHaveBeenCalledWith({ port: 4000 });
  });

  it('should setup watcher', async () => {
    registerDevCommand(program);
    await program.parseAsync(['node', 'test', 'dev']);

    expect(chokidar.watch).toHaveBeenCalledWith(
      ['src/actions/**/*', 'src/flux/**/*'],
      expect.any(Object)
    );
  });

  it('should reload on file change', async () => {
    registerDevCommand(program);
    await program.parseAsync(['node', 'test', 'dev']);

    const changeCallback = mockWatcher.on.mock.calls.find((call: any) => call[0] === 'change')[1];
    await changeCallback('some/file.ts');

    expect(mockServer.reload).toHaveBeenCalled();
  });
});
