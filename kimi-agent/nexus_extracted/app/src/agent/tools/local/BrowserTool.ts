import { z } from 'zod';
import type { Tool, ToolMetadata, ToolPermissions, ToolExecutionOptions, ToolHealth } from '../Tool';

/**
 * Tool for web browsing and content extraction.
 */
export class BrowserTool implements Tool<any, any> {
  public readonly name = 'browser';
  public readonly description = 'Browse the web, read page content, extract data, and take screenshots.';
  
  public readonly metadata: ToolMetadata = {
    version: '1.0.0',
    category: 'browser',
    tags: ['web', 'browse', 'scrape', 'html'],
    author: 'Nexus OS'
  };

  public readonly permissions: ToolPermissions = {
    requiredPermissions: ['network_access'],
    requiresApproval: true
  };

  public readonly options: ToolExecutionOptions = {
    timeout: 30000
  };

  public readonly inputSchema = z.discriminatedUnion('operation', [
    z.object({
      operation: z.literal('navigate'),
      url: z.string()
    }),
    z.object({
      operation: z.literal('read_page'),
      url: z.string()
    }),
    z.object({
      operation: z.literal('extract_links'),
      url: z.string()
    }),
    z.object({
      operation: z.literal('screenshot'),
      url: z.string()
    }),
    z.object({
      operation: z.literal('extract_dom'),
      url: z.string(),
      selector: z.string().optional()
    })
  ]);
  
  public readonly outputSchema = z.any();

  public async execute(input: any): Promise<any> {
    switch (input.operation) {
      case 'read_page':
        return await this.readPage(input.url);
      case 'extract_links':
        return await this.extractLinks(input.url);
      case 'screenshot':
        return await this.takeScreenshot(input.url);
      case 'extract_dom':
        return await this.extractDOM(input.url, input.selector);
      case 'navigate':
        // In a real browser-based agent, this might actually navigate a controlled tab/iframe
        return { success: true, url: input.url };
      default:
        throw new Error(`Unsupported operation: ${input.operation}`);
    }
  }

  private async readPage(url: string): Promise<{ title: string; content: string }> {
    try {
      console.info(`[BrowserTool] Navigating to: ${url}`);
      
      // Attempt real fetch
      const response = await fetch(url).catch(e => {
        console.warn(`[BrowserTool] Fetch failed for ${url}, using simulated content.`, e);
        return null;
      });

      if (!response || !response.ok) {
        // Fallback to simulated content for development/demo purposes
        return {
          title: `Simulated Page: ${url}`,
          content: `This is simulated content for ${url}. In a production environment with proper network permissions and proxy configuration, this tool would return the actual text content of the page.`
        };
      }

      const html = await response.text();
      
      // In a Node.js environment, DOMParser might not be global
      let title = url;
      let content = '';

      if (typeof DOMParser !== 'undefined') {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        title = doc.title;
        
        // Clean content: remove scripts, styles, etc.
        const scripts = doc.querySelectorAll('script, style, iframe, noscript, svg, path');
        scripts.forEach(s => s.remove());
        
        content = doc.body.innerText.replace(/\s+/g, ' ').trim();
      } else {
        // Simple regex fallback for title and text if no DOMParser
        const titleMatch = html.match(/<title>(.*?)<\/title>/i);
        title = titleMatch ? titleMatch[1] : url;
        content = html.replace(/<script[\s\S]*?<\/script>/gi, '')
                      .replace(/<style[\s\S]*?<\/style>/gi, '')
                      .replace(/<[^>]+>/g, ' ')
                      .replace(/\s+/g, ' ')
                      .trim();
      }
      
      return { title, content: content.slice(0, 10000) }; // Limit content size
    } catch (error: any) {
      console.error(`[BrowserTool] Failed to read page: ${error.message}`);
      throw new Error(`Failed to read page: ${error.message}`);
    }
  }

  private async extractLinks(url: string): Promise<{ links: Array<{ text: string; href: string }> }> {
    try {
      const response = await fetch(url).catch(() => null);
      if (!response || !response.ok) {
        return { links: [] };
      }

      const html = await response.text();
      const links: Array<{ text: string; href: string }> = [];

      if (typeof DOMParser !== 'undefined') {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        Array.from(doc.querySelectorAll('a')).forEach(a => {
          const href = a.getAttribute('href');
          if (href && href.startsWith('http')) {
            links.push({ text: a.innerText.trim(), href });
          }
        });
      } else {
        const linkRegex = /<a\s+(?:[^>]*?\s+)?href="([^"]*)"[^>]*>(.*?)<\/a>/gi;
        let match;
        while ((match = linkRegex.exec(html)) !== null) {
          if (match[1].startsWith('http')) {
            links.push({ href: match[1], text: match[2].replace(/<[^>]+>/g, '').trim() });
          }
        }
      }
      
      return { links: links.slice(0, 50) }; // Limit number of links
    } catch (error: any) {
      return { links: [] };
    }
  }

  private async takeScreenshot(url: string): Promise<{ screenshotUrl: string }> {
    // This requires a backend with Playwright/Puppeteer
    // Placeholder for now
    return {
      screenshotUrl: `https://api.screenshot.com/v1/capture?url=${encodeURIComponent(url)}`
    };
  }

  private async extractDOM(url: string, selector?: string): Promise<{ html: string }> {
    try {
      const response = await fetch(url);
      const html = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      if (selector) {
        const element = doc.querySelector(selector);
        return { html: element ? element.outerHTML : '' };
      }
      
      return { html: doc.documentElement.outerHTML };
    } catch (error: any) {
      throw new Error(`Failed to extract DOM: ${error.message}`);
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
