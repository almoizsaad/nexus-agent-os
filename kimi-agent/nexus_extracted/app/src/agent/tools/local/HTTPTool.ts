import { z } from 'zod';
import type { Tool, ToolMetadata, ToolPermissions, ToolExecutionOptions, ToolHealth } from '../Tool';
import { ConnectivityLayer } from '../../core/ConnectivityLayer';

/**
 * Tool for performing HTTP requests.
 */
export class HTTPTool implements Tool<any, any> {
  public readonly name = 'http';
  public readonly description = 'Perform HTTP requests (GET, POST, PUT, DELETE, etc.) to any API.';
  
  public readonly metadata: ToolMetadata = {
    version: '1.1.0',
    category: 'http',
    tags: ['http', 'api', 'rest', 'network', 'resilient'],
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
    responseType: z.enum(['json', 'text', 'blob']).default('json'),
    rateLimitKey: z.string().optional()
  }).passthrough();
  
  public readonly outputSchema = z.any();

  public async execute(input: any, options?: ToolExecutionOptions): Promise<any> {
    const { url, method, headers, body, responseType, rateLimitKey } = input;
    
    // Apply rate limiting if a key is provided
    if (rateLimitKey) {
      await ConnectivityLayer.withRateLimit(rateLimitKey, 10, 60000); // Default 10 req/min per key
    }

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

    return await ConnectivityLayer.withRetry(async () => {
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
    });
  }

  public async checkHealth(): Promise<ToolHealth> {
    try {
      // Basic connectivity check to a reliable endpoint
      const start = Date.now();
      await fetch('https://www.google.com', { method: 'HEAD', mode: 'no-cors' });
      return {
        status: 'healthy',
        lastChecked: new Date(),
        errorCount: 0,
        latency: Date.now() - start
      };
    } catch (error: any) {
      return {
        status: 'degraded',
        lastChecked: new Date(),
        errorCount: 1,
        message: `Network check failed: ${error.message}`
      };
    }
  }
}
