import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { AgentRunner, AgentStepRequest, AgentStepResult } from "./runner";
type Executor = (command: string, args: string[]) => Promise<string>;
const execute: Executor = async (command, args) => (await promisify(execFile)(command, args, { encoding: "utf8" })).stdout;

export function createPythonAgentRunner(executor: Executor = execute, options: { python?: string; script?: string } = {}): AgentRunner {
  return {
    async plan(request) { return { steps: ["load-profile", ...request.channels.map((channel) => `study-${channel}`), "write", "review", "save"] }; },
    async executeStep(request: AgentStepRequest) {
      const payload = JSON.stringify({ contractVersion: 1, ...request });
      const output = await executor(options.python ?? "python", [options.script ?? "ore-studio/scripts/run_agency.py", "--request-json", payload]);
      const result = JSON.parse(output) as AgentStepResult;
      if (result.contractVersion !== 1 || !Array.isArray(result.artifacts)) throw new Error("Invalid ORE agent contract response");
      return result;
    },
  };
}
