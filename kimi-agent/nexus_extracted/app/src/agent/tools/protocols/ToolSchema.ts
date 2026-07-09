/**
 * Advanced Tool interface with schema validation support.
 */
export interface AdvancedTool<TInput = any, TOutput = any> {
  name: string;
  description: string;
  inputSchema: any; // JSON Schema or Zod
  outputSchema: any;
  execute(input: TInput): Promise<TOutput>;
}

/**
 * Helper to check if a tool is an AdvancedTool.
 */
export function isAdvancedTool(tool: any): tool is AdvancedTool {
  return 'inputSchema' in tool && 'outputSchema' in tool;
}
