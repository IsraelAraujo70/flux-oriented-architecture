import { FluxExecutor } from "../../../src/core/executor";
import { FluxLoader } from "../../../src/core/loader";
import { FluxContext } from "../../../src/types";
import { ActionNode, ConditionNode } from "../../../src/types";

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
});
