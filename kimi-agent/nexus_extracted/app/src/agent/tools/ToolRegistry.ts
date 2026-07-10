import type { Tool } from './Tool';
import { isAdvancedTool } from './protocols/ToolSchema';
import type { AdvancedTool } from './protocols/ToolSchema';

/**
 * ToolRegistry manages a collection of tools, providing methods for
 * registration, retrieval, and safe execution with validation.
 */
export class ToolRegistry {
  private tools: Map<string, Tool | AdvancedTool> = new Map();

  /**
   * Registers a new tool in the registry.
   */
  public register(tool: Tool | AdvancedTool): void {
    if (this.tools.has(tool.name)) {
      throw new Error(`[ToolRegistry] Tool with name "${tool.name}" is already registered.`);
    }
    this.tools.set(tool.name, tool);
  }

  /**
   * Checks if a tool with the given name is registered.
   */
  public hasTool(name: string): boolean {
    return this.tools.has(name);
  }

  /**
   * Retrieves a tool by its unique name.
   */
  public getTool(name: string): Tool | AdvancedTool | undefined {
    return this.tools.get(name);
  }

  /**
   * Returns a list of all registered tool names and descriptions.
   */
  public listTools(): Array<{ name: string; description: string }> {
    return Array.from(this.tools.values()).map((tool) => ({
      name: tool.name,
      description: tool.description,
    }));
  }

  /**
   * Provides a detailed string description of all tools including schemas.
   */
  public describeTools(): string {
    return Array.from(this.tools.values()).map(tool => {
      let desc = `- ${tool.name}: ${tool.description}`;
      if (isAdvancedTool(tool)) {
        desc += `\n  Input Schema: ${JSON.stringify(tool.inputSchema)}`;
      }
      return desc;
    }).join('\n');
  }

  /**
   * Validates input against a tool's schema.
   */
  public validateInput(name: string, input: unknown): boolean {
    const tool = this.getTool(name);
    if (!tool || !isAdvancedTool(tool)) return true; // Default to true if no schema
    
    if (typeof input !== 'object' || input === null) return false;

    // Basic structural validation (can be replaced with AJV or Zod)
    const required = (tool.inputSchema as { required?: string[] }).required || [];
    return required.every((key: string) => key in (input as Record<string, unknown>));
  }

  /**
   * Executes a tool with validation.
   */
  public async executeWithValidation<TInput = unknown, TOutput = unknown>(
    name: string,
    input: TInput
  ): Promise<TOutput> {
    if (!this.validateInput(name, input)) {
      throw new Error(`[ToolRegistry] Input validation failed for tool "${name}".`);
    }
    return this.executeTool<TInput, TOutput>(name, input);
  }

  /**
   * Executes a tool safely by its name.
   */
  public async executeTool<TInput = unknown, TOutput = unknown>(
    name: string,
    input: TInput
  ): Promise<TOutput> {
    const tool = this.getTool(name);
    if (!tool) {
      throw new Error(`[ToolRegistry] Tool with name "${name}" not found.`);
    }

    try {
      return await tool.execute(input) as TOutput;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`[ToolRegistry] Error executing tool "${name}": ${message}`);
    }
  }

  public unregister(name: string): void {
    this.tools.delete(name);
  }

  public clear(): void {
    this.tools.clear();
  }
}

// Export a singleton instance for common use cases
export const globalToolRegistry = new ToolRegistry();
