import { z } from 'zod';
import type { Tool, ToolMetadata, ToolPermissions, ToolExecutionOptions, ToolHealth } from '../Tool';

/**
 * Tool for interacting with the local filesystem.
 * Note: Requires a Node.js environment.
 */
export class FilesystemTool implements Tool<any, any> {
  public readonly name = 'filesystem';
  public readonly description = 'Read, write, list, and manage files and directories.';
  
  public readonly metadata: ToolMetadata = {
    version: '1.0.0',
    category: 'filesystem',
    tags: ['fs', 'files', 'io'],
    author: 'Nexus OS'
  };

  public readonly permissions: ToolPermissions = {
    requiredPermissions: ['fs_read', 'fs_write'],
    requiresApproval: true
  };

  public readonly options: ToolExecutionOptions = {
    timeout: 5000
  };

  public readonly inputSchema = z.discriminatedUnion('operation', [
    z.object({
      operation: z.literal('read_file'),
      path: z.string(),
      encoding: z.string().default('utf8')
    }),
    z.object({
      operation: z.literal('write_file'),
      path: z.string(),
      content: z.string(),
      encoding: z.string().default('utf8')
    }),
    z.object({
      operation: z.literal('list_directory'),
      path: z.string().default('.')
    }),
    z.object({
      operation: z.literal('delete_file'),
      path: z.string()
    }),
    z.object({
      operation: z.literal('make_directory'),
      path: z.string(),
      recursive: z.boolean().default(true)
    }),
    z.object({
      operation: z.literal('exists'),
      path: z.string()
    })
  ]);
  
  public readonly outputSchema = z.any();

  public async execute(input: any): Promise<any> {
    // Dynamic import to avoid breaking browser environments if they don't use this tool
    let fs;
    try {
      fs = await import('node:fs/promises');
    } catch {
      throw new Error('FilesystemTool is only available in a Node.js environment.');
    }

    switch (input.operation) {
      case 'read_file':
        return await fs.readFile(input.path, { encoding: input.encoding as any });
      
      case 'write_file':
        await fs.writeFile(input.path, input.content, { encoding: input.encoding as any });
        return { success: true, path: input.path };
      
      case 'list_directory':
        return await fs.readdir(input.path);
      
      case 'delete_file':
        await fs.unlink(input.path);
        return { success: true };
      
      case 'make_directory':
        await fs.mkdir(input.path, { recursive: input.recursive });
        return { success: true, path: input.path };
      
      case 'exists':
        try {
          await fs.access(input.path);
          return { exists: true };
        } catch {
          return { exists: false };
        }
      
      default:
        throw new Error(`Unsupported operation: ${input.operation}`);
    }
  }

  public async checkHealth(): Promise<ToolHealth> {
    try {
      await import('node:fs/promises');
      return { status: 'healthy', lastChecked: new Date(), errorCount: 0 };
    } catch {
      return { status: 'degraded', lastChecked: new Date(), errorCount: 1 };
    }
  }
}
