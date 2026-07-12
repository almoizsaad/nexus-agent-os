import { z } from 'zod';
import type { Tool, ToolMetadata, ToolPermissions, ToolExecutionOptions, ToolHealth } from '../Tool';

/**
 * Tool for basic Markdown processing and extraction.
 */
export class MarkdownTool implements Tool<{ text: string; operation: 'extract_headers' | 'extract_links' }, { results: string[] }> {
  public readonly name = 'markdown_processor';
  public readonly description = 'Extract headers or links from markdown text.';
  
  public readonly metadata: ToolMetadata = {
    version: '1.0.0',
    category: 'utility',
    tags: ['markdown', 'md', 'parse'],
    author: 'Nexus OS'
  };

  public readonly permissions: ToolPermissions = {
    requiredPermissions: [],
    requiresApproval: false
  };

  public readonly options: ToolExecutionOptions = {
    timeout: 1000
  };

  public readonly inputSchema = z.object({
    text: z.string(),
    operation: z.enum(['extract_headers', 'extract_links'])
  });
  
  public readonly outputSchema = z.object({
    results: z.array(z.string())
  });

  public async execute(input: { text: string; operation: 'extract_headers' | 'extract_links' }): Promise<{ results: string[] }> {
    const results: string[] = [];
    
    if (input.operation === 'extract_headers') {
      const lines = input.text.split('\n');
      for (const line of lines) {
        if (line.startsWith('#')) {
          results.push(line.trim());
        }
      }
    } else if (input.operation === 'extract_links') {
      const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
      let match;
      while ((match = linkRegex.exec(input.text)) !== null) {
        results.push(match[2]); // Extract URL
      }
    }
    
    return { results };
  }

  public async checkHealth(): Promise<ToolHealth> {
    return {
      status: 'healthy',
      lastChecked: new Date(),
      errorCount: 0
    };
  }
}
