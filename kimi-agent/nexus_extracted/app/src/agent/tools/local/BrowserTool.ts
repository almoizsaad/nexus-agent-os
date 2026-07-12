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
      // In a browser environment, this might be blocked by CORS
      // In a production agent OS, this would go through a proxy or a headless browser
      const response = await fetch(url);
      const html = await response.text();
      
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      // Clean content: remove scripts, styles, etc.
      const scripts = doc.querySelectorAll('script, style, iframe, noscript');
      scripts.forEach(s => s.remove());
      
      return {
        title: doc.title,
        content: doc.body.innerText.replace(/\s+/g, ' ').trim()
      };
    } catch (error: any) {
      throw new Error(`Failed to read page: ${error.message}`);
    }
  }

  private async extractLinks(url: string): Promise<{ links: Array<{ text: string; href: string }> }> {
    try {
      const response = await fetch(url);
      const html = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      const links = Array.from(doc.querySelectorAll('a'))
        .map(a => ({
          text: a.innerText.trim(),
          href: a.getAttribute('href') || ''
        }))
        .filter(l => l.href.startsWith('http'));
      
      return { links };
    } catch (error: any) {
      throw new Error(`Failed to extract links: ${error.message}`);
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
