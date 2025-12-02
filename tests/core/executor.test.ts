import { FluxExecutor } from "../../src/core/executor";
import { FluxLoader } from "../../src/core/loader";
import { FluxContext } from "../../src/types";
import { ActionNode, ConditionNode } from "../../src/types";

// Mock Loader
const mockLoader = {
  getAction: jest.fn(),
} as unknown as FluxLoader;

// Mock Config
const mockConfig = {
  server: { port: 3000 },
  paths: { actions: "actions", flux: "flux" },
  logging: { level: "error" as const },
};

describe("FluxExecutor", () => {
  let executor: FluxExecutor;
  let context: FluxContext;

  beforeEach(() => {
    executor = new FluxExecutor(mockConfig, mockLoader);
    context = {
      req: {} as any,
      res: {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
        json: jest.fn(),
        headersSent: false,
      } as any,
      input: {},
      results: {},
      state: {},
      plugins: {},
    };
    jest.clearAllMocks();
  });

  it("should execute an action node", async () => {
    const actionNode: ActionNode = {
      type: "action",
      name: "testAction",
      path: "some/path",
      args: { foo: "bar" },
    };

    const mockAction = jest.fn().mockResolvedValue({ success: true });
    (mockLoader.getAction as jest.Mock).mockReturnValue(mockAction);

    const flux = {
      endpoint: "/test",
      method: "GET" as const,
      flow: [actionNode],
    };

    await executor.executeFlux(flux, context);

    expect(mockLoader.getAction).toHaveBeenCalledWith("some/path");
    expect(mockAction).toHaveBeenCalled();
    expect(context.results.testAction).toEqual({ success: true });
  });

  it("should execute a condition node (true branch)", async () => {
    const conditionNode: ConditionNode = {
      type: "condition",
      if: "${input.flag}",
      then: [{ type: "return", body: "true-branch" }],
      else: [{ type: "return", body: "false-branch" }],
    };

    context.input.flag = true;

    const flux = {
      endpoint: "/test",
      method: "GET" as const,
      flow: [conditionNode],
    };

    await executor.executeFlux(flux, context);

    expect(context.res.send).toHaveBeenCalledWith("true-branch");
    expect(context.res.send).not.toHaveBeenCalledWith("false-branch");
  });

  it("should execute a condition node (false branch)", async () => {
    const conditionNode: ConditionNode = {
      type: "condition",
      if: "${input.flag}",
      then: [{ type: "return", body: "true-branch" }],
      else: [{ type: "return", body: "false-branch" }],
    };

    context.input.flag = false;

    const flux = {
      endpoint: "/test",
      method: "GET" as const,
      flow: [conditionNode],
    };
    await executor.executeFlux(flux, context);

    expect(context.res.send).toHaveBeenCalledWith("false-branch");
  });

  it("should handle action errors gracefully", async () => {
    const actionNode: ActionNode = {
      type: "action",
      name: "fail",
      path: "fail",
    };
    (mockLoader.getAction as jest.Mock).mockReturnValue(async () => {
      throw new Error("Boom");
    });

    const flux = {
      endpoint: "/test",
      method: "GET" as const,
      flow: [actionNode],
    };

    await executor.executeFlux(flux, context);

    expect(context.res.status).toHaveBeenCalledWith(500);
    expect(context.res.send).not.toHaveBeenCalled();
  });

  it('should execute a forEach node', async () => {
    const forEachNode = {
      type: 'forEach' as const,
      items: '${input.items}',
      as: 'item',
      do: [
        { 
          type: 'action' as const, 
          name: 'process', 
          path: 'processItem',
          args: { val: '${item}' }
        }
      ]
    };

    context.input.items = [1, 2, 3];
    
    const mockAction = jest.fn().mockImplementation(async (ctx) => {
      return ctx.item * 2;
    });
    (mockLoader.getAction as jest.Mock).mockReturnValue(mockAction);

    const flux = {
      endpoint: '/test',
      method: 'GET' as const,
      flow: [forEachNode]
    };

    await executor.executeFlux(flux, context);

    expect(mockAction).toHaveBeenCalledTimes(3);
    expect(context.item).toBeUndefined(); 
  });

  it('should execute a parallel node', async () => {
    const parallelNode = {
      type: 'parallel' as const,
      branches: [
        [{ type: 'action' as const, name: 'b1', path: 'branch1' }],
        [{ type: 'action' as const, name: 'b2', path: 'branch2' }]
      ]
    };

    const action1 = jest.fn().mockResolvedValue('res1');
    const action2 = jest.fn().mockResolvedValue('res2');

    (mockLoader.getAction as jest.Mock).mockImplementation((path) => {
      if (path === 'branch1') return action1;
      if (path === 'branch2') return action2;
      return null;
    });

    const flux = {
      endpoint: '/test',
      method: 'GET' as const,
      flow: [parallelNode]
    };

    await executor.executeFlux(flux, context);

    expect(action1).toHaveBeenCalled();
    expect(action2).toHaveBeenCalled();
    expect(context.results.b1).toBe('res1');
    expect(context.results.b2).toBe('res2');
  });

  it('should execute a try/catch node (success path)', async () => {
    const tryNode = {
      type: 'try' as const,
      try: [{ type: 'action' as const, name: 'ok', path: 'okAction' }],
      catch: [{ type: 'return' as const, body: 'caught' }]
    };

    const okAction = jest.fn().mockResolvedValue('ok');
    (mockLoader.getAction as jest.Mock).mockReturnValue(okAction);

    const flux = { endpoint: '/test', method: 'GET' as const, flow: [tryNode] };
    await executor.executeFlux(flux, context);

    expect(okAction).toHaveBeenCalled();
    expect(context.res.status).toHaveBeenCalledWith(200);
    expect(context.res.send).toHaveBeenCalledWith({ success: true });
  });

  it('should execute a try/catch node (error path)', async () => {
    const tryNode = {
      type: 'try' as const,
      try: [{ type: 'action' as const, name: 'bad', path: 'badAction' }],
      catch: [{ type: 'return' as const, body: 'caught' }],
      errorVar: 'err'
    };

    const badAction = jest.fn().mockRejectedValue(new Error('fail'));
    (mockLoader.getAction as jest.Mock).mockReturnValue(badAction);

    const flux = { endpoint: '/test', method: 'GET' as const, flow: [tryNode] };
    await executor.executeFlux(flux, context);

    expect(context.err).toBeDefined();
    expect(context.res.send).toHaveBeenCalledWith('caught');
  });
});
