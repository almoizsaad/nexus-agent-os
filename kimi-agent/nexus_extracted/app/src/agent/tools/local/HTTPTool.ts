import { z } from 'zod';
import type { Tool, ToolMetadata, ToolPermissions, ToolExecutionOptions, ToolHealth } from '../Tool';

/**
 * Tool for performing HTTP requests.
 */
export class HTTPTool implements Tool<any, any> {
  public readonly name = 'http';
  public readonly description = 'Perform HTTP requests (GET, POST, PUT, DELETE, etc.) to any API.';
  
  public readonly metadata: ToolMetadata = {
    version: '1.0.0',
    category: 'http',
    tags: ['http', 'api', 'rest', 'network'],
    author: 'Nexus OS'
  };

  public readonly permissions: ToolPermissions = {
    requiredPermissions: ['network_access'],
    requiresApproval: true
  };

  public readonly options: ToolExecutionOptions = {
    timeout: 30000
  };

  public readonly inputSchema = z.object({
    url: z.string(),
    method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']).default('GET'),
    headers: z.record(z.string(), z.string()).optional(),
    body: z.any().optional(),
    responseType: z.enum(['json', 'text', 'blob']).default('json')
  });
  
  public readonly outputSchema = z.any();

  public async execute(input: any, options?: ToolExecutionOptions): Promise<any> {
    const { url, method, headers, body, responseType } = input;
    
    const fetchOptions: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    if (body && ['POST', 'PUT', 'PATCH'].includes(method)) {
      fetchOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
    }

    try {
      const response = await fetch(url, fetchOptions);
      
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
      }

      if (options?.streaming && options.onStream && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          options.onStream(decoder.decode(value, { stream: true }));
        }
      }

      switch (responseType) {
        case 'json':
          return await response.json();
        case 'text':
          return await response.text();
        case 'blob':
          return await response.blob();
        default:
          return await response.json();
      }
    } catch (error: any) {
      throw new Error(`HTTP Request failed: ${error.message}`);
    }
  }

  public async checkHealth(): Promise<ToolHealth> {
    return {
      status: 'healthy',
      lastChecked: new Date(),
      errorCount: 0
    };
  }
}
