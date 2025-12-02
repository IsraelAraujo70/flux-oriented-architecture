import { Command } from 'commander';
import { registerInitCommand } from '../../src/cli/commands/init';
import fs from 'fs';
import path from 'path';

jest.mock('fs');

describe('Init Command', () => {
  let program: Command;
  const mockCwd = '/mock/path';

  beforeEach(() => {
    program = new Command();
    jest.spyOn(process, 'cwd').mockReturnValue(mockCwd);
    jest.spyOn(console, 'log').mockImplementation(() => {});
    // Mock existsSync to return false by default (clean state)
    (fs.existsSync as jest.Mock).mockReturnValue(false);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should register init command', () => {
    registerInitCommand(program);
    const cmd = program.commands.find((c) => c.name() === 'init');
    expect(cmd).toBeDefined();
  });

  it('should create necessary directories', async () => {
    registerInitCommand(program);
    await program.parseAsync(['node', 'test', 'init']);

    expect(fs.mkdirSync).toHaveBeenCalledWith(path.join(mockCwd, 'src/actions'), {
      recursive: true
    });
    expect(fs.mkdirSync).toHaveBeenCalledWith(path.join(mockCwd, 'src/flux'), { recursive: true });
  });

  it('should create configuration files', async () => {
    registerInitCommand(program);
    await program.parseAsync(['node', 'test', 'init']);

    expect(fs.writeFileSync).toHaveBeenCalledWith(
      path.join(mockCwd, 'package.json'),
      expect.any(String)
    );
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      path.join(mockCwd, 'tsconfig.json'),
      expect.any(String)
    );
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      path.join(mockCwd, 'foa.config.json'),
      expect.any(String)
    );
  });

  it('should create example files', async () => {
    registerInitCommand(program);
    await program.parseAsync(['node', 'test', 'init']);

    expect(fs.writeFileSync).toHaveBeenCalledWith(
      path.join(mockCwd, 'src/actions/hello.ts'),
      expect.any(String)
    );
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      path.join(mockCwd, 'src/flux/hello.json'),
      expect.any(String)
    );
  });

  it('should not overwrite existing package.json but update it', async () => {
    const existingPackage = {
      name: 'existing-project',
      version: '0.0.1',
      scripts: { test: 'echo test' },
      dependencies: { express: '^4.0.0' }
    };

    (fs.existsSync as jest.Mock).mockImplementation((p: string) => {
      return p.endsWith('package.json');
    });
    (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(existingPackage));

    registerInitCommand(program);
    await program.parseAsync(['node', 'test', 'init']);

    const writeCall = (fs.writeFileSync as jest.Mock).mock.calls.find((call) =>
      call[0].endsWith('package.json')
    );
    const writtenContent = JSON.parse(writeCall[1]);

    expect(writtenContent.name).toBe('existing-project'); // Kept existing name
    expect(writtenContent.scripts.test).toBe('echo test'); // Kept existing script
    expect(writtenContent.scripts.dev).toBe('foa dev'); // Added new script
    expect(writtenContent.dependencies.express).toBe('^4.0.0'); // Kept existing dep
    expect(writtenContent.dependencies['flux-oriented-architecture']).toBe('latest'); // Added new dep
  });
});
