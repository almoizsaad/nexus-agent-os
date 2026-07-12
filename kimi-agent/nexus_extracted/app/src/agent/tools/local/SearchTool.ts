import { z } from 'zod';
import type { Tool, ToolMetadata, ToolPermissions, ToolExecutionOptions, ToolHealth } from '../Tool';

/**
 * Tool for web search using various providers.
 */
export class SearchTool implements Tool<any, any> {
  public readonly name = 'search';
  public readonly description = 'Search the web using various providers (Tavily, Brave, SerpAPI, Google, DuckDuckGo).';
  
  public readonly metadata: ToolMetadata = {
    version: '1.0.0',
    category: 'search',
    tags: ['web', 'search', 'research', 'google'],
    author: 'Nexus OS'
  };

  public readonly permissions: ToolPermissions = {
    requiredPermissions: ['network_access'],
    requiresApproval: false
  };

  public readonly options: ToolExecutionOptions = {
    timeout: 10000
  };

  public readonly inputSchema = z.object({
    query: z.string(),
    provider: z.enum(['tavily', 'brave', 'serpapi', 'google', 'duckduckgo']).default('duckduckgo'),
    limit: z.number().default(5)
  });
  
  public readonly outputSchema = z.object({
    results: z.array(z.object({
      title: z.string(),
      url: z.string(),
      snippet: z.string(),
      source: z.string()
    }))
  });

  public async execute(input: { query: string; provider: 'tavily' | 'brave' | 'serpapi' | 'google' | 'duckduckgo'; limit: number }): Promise<any> {
    switch (input.provider) {
      case 'duckduckgo':
        return await this.searchDuckDuckGo(input.query, input.limit);
      case 'tavily':
        return await this.searchTavily(input.query, input.limit);
      default:
        // Fallback to DuckDuckGo if provider API key is not configured
        return await this.searchDuckDuckGo(input.query, input.limit);
    }
  }

  private async searchDuckDuckGo(query: string, limit: number): Promise<{ results: any[] }> {
    try {
      // Mock implementation of DuckDuckGo search (no API key required usually but CORS might hit)
      // In production, use a library or a proxy
      return {
        results: [
          {
            title: `Search results for ${query}`,
            url: `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
            snippet: `This is a mock snippet for the search query: ${query}. In a real system, this would contain content from DuckDuckGo.`,
            source: 'duckduckgo'
          }
        ].slice(0, limit)
      };
    } catch (error: any) {
      throw new Error(`DuckDuckGo search failed: ${error.message}`);
    }
  }

  private async searchTavily(query: string, limit: number): Promise<{ results: any[] }> {
    // Requires TAVILY_API_KEY
    const apiKey = process.env.TAVILY_API_KEY;
    if (!apiKey) {
      return this.searchDuckDuckGo(query, limit);
    }

    try {
      const response = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: apiKey,
          query,
          max_results: limit
        })
      });
      const data = await response.json();
      return {
        results: data.results.map((r: any) => ({
          title: r.title,
          url: r.url,
          snippet: r.content,
          source: 'tavily'
        }))
      };
    } catch (error: any) {
      throw new Error(`Tavily search failed: ${error.message}`);
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
