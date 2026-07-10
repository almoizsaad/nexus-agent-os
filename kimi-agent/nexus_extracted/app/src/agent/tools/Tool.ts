/**
 * Interface representing a tool that can be executed by the Agent OS.
 */
export interface Tool<TInput = unknown, TOutput = unknown> {
  /**
   * The unique name of the tool.
   */
  readonly name: string;

  /**
   * A clear description of what the tool does and its parameters.
   */
  readonly description: string;

  /**
   * Executes the tool with the provided input.
   * @param input The input parameters for the tool.
   * @returns A promise that resolves to the tool's output.
   */
  execute(input: TInput): Promise<TOutput>;
}
