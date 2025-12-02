import { Command } from 'commander';
import { registerVisualizeCommand } from '../../src/cli/commands/visualize';
import express from 'express';
import fs from 'fs/promises';
import { glob } from 'glob';
import { loadConfig } from '../../src/cli/config';
import { validateFluxDefinition } from '../../src/core/validator';

jest.mock('express');
jest.mock('fs/promises');
jest.mock('glob', () => ({ glob: jest.fn() }));
jest.mock('../../src/cli/config');
jest.mock('../../src/core/validator');

describe('Visualize Command', () => {
  let program: Command;
  let mockGet: jest.Mock;
  let mockListen: jest.Mock;
  let mockListenOn: jest.Mock;
  let mockExpress: jest.MockedFunction<typeof express>;
  let mockGlob: jest.MockedFunction<typeof glob>;

  beforeEach(() => {
    program = new Command();

    mockExpress = express as unknown as jest.MockedFunction<typeof express>;
    mockGlob = glob as unknown as jest.MockedFunction<typeof glob>;

    mockGet = jest.fn();
    mockListenOn = jest.fn();
    mockListen = jest.fn((_port, _host, cb) => {
      if (cb) cb();
      return { on: mockListenOn };
    });
    mockExpress.mockReturnValue({ get: mockGet, listen: mockListen } as any);

    (loadConfig as jest.Mock).mockResolvedValue({ paths: { flux: 'src/flux' } });
    (validateFluxDefinition as jest.Mock).mockReturnValue({ valid: true, errors: [] });
    mockGlob.mockResolvedValue([]);

    (fs.access as jest.Mock).mockRejectedValue(new Error('not found'));
    (fs.readFile as jest.Mock).mockImplementation((p: any) => {
      const path = String(p);
      if (path.endsWith('.json')) {
        return Promise.resolve(JSON.stringify({ name: 'Test Flux', flow: [] }));
      }
      return Promise.resolve('<html></html>');
    });

    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('registers visualize command', () => {
    registerVisualizeCommand(program);
    const cmd = program.commands.find((c) => c.name() === 'visualize');
    expect(cmd).toBeDefined();
  });

  it('lists flux files when --list is provided', async () => {
    mockGlob.mockResolvedValue(['/tmp/a.json', '/tmp/b.json']);
    registerVisualizeCommand(program);

    await program.parseAsync(['node', 'test', 'visualize', 'anything', '--list']);

    expect(glob).toHaveBeenCalledWith(expect.stringContaining('src/flux/**/*.json'), {
      windowsPathsNoEscape: true
    });
    expect(console.log).toHaveBeenCalledWith('Available flux definitions:');
    expect(mockListen).not.toHaveBeenCalled();
  });

  it('reports when flux file cannot be resolved', async () => {
    registerVisualizeCommand(program);

    await program.parseAsync(['node', 'test', 'visualize', 'missing']);

    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('Flux definition not found for "missing"')
    );
    expect(mockListen).not.toHaveBeenCalled();
  });

  it('starts server and wires routes for valid flux', async () => {
    (fs.access as jest.Mock).mockImplementation((p: any) => {
      if (String(p).includes('demo.json')) return Promise.resolve();
      return Promise.reject(new Error('not found'));
    });

    registerVisualizeCommand(program);
    await program.parseAsync(['node', 'test', 'visualize', 'demo.json', '--port', '7777']);

    expect(fs.readFile).toHaveBeenCalledWith(expect.stringContaining('demo.json'), 'utf-8');
    expect(validateFluxDefinition).toHaveBeenCalledWith({ name: 'Test Flux', flow: [] });
    expect(mockGet).toHaveBeenCalledWith('/data', expect.any(Function));
    expect(mockGet).toHaveBeenCalledWith('/', expect.any(Function));
    expect(mockListen).toHaveBeenCalledWith(7777, '127.0.0.1', expect.any(Function));
    expect(mockListenOn).toHaveBeenCalledWith('error', expect.any(Function));
  });
});
