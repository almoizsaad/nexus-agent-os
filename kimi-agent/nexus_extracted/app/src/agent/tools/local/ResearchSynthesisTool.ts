import { z } from 'zod';
import type { Tool, ToolMetadata, ToolPermissions, ToolExecutionOptions, ToolHealth } from '../Tool';

/**
 * Tool for synthesizing research findings, including summarization and comparison.
 */
export class ResearchSynthesisTool implements Tool<any, any> {
  public readonly name = 'research_synthesis';
  public readonly description = 'Synthesize research data: summarize multiple sources, compare facts, and generate cited reports.';
  
  public readonly metadata: ToolMetadata = {
    version: '1.0.0',
    category: 'other',
    tags: ['research', 'summary', 'compare', 'cite'],
    author: 'Nexus OS'
  };

  public readonly permissions: ToolPermissions = {
    requiredPermissions: ['read_memory'],
    requiresApproval: false
  };

  public readonly options: ToolExecutionOptions = {
    timeout: 30000
  };

  public readonly inputSchema = z.object({
    operation: z.enum(['summarize', 'compare', 'generate_report']).optional().default('summarize'),
    sources: z.array(z.object({
      content: z.string().optional(),
      snippet: z.string().optional(),
      title: z.string().optional(),
      url: z.string().optional()
    })).optional().default([]),
    focus: z.string().optional(),
    facts: z.array(z.object({
      claim: z.string().optional(),
      snippet: z.string().optional(),
      content: z.string().optional(),
      source: z.string().optional(),
      url: z.string().optional()
    })).optional().default([]),
    topic: z.string().optional().default('General Research'),
    findings: z.array(z.any()).optional().default([]),
    includeCitations: z.boolean().optional().default(true)
  });
  
  public readonly outputSchema = z.any();

  public async execute(input: any): Promise<any> {
    let operation = input.operation;

    // Smarter inference if operation is missing
    if (!operation) {
      if (input.sources && input.sources.length > 0) operation = 'summarize';
      else if (input.facts && input.facts.length > 0) operation = 'compare';
      else if (input.findings && input.findings.length > 0) operation = 'generate_report';
      else operation = 'summarize';
    }

    switch (operation) {
      case 'summarize':
        return this.summarize(input.sources || [], input.focus);
      case 'compare':
        return this.compare(input.facts || []);
      case 'generate_report':
        return this.generateReport(input.topic || 'Research Report', input.findings || [], !!input.includeCitations);
      default:
        return this.summarize(input.sources || [], input.focus);
    }
  }

  private summarize(sources: any, focus?: string): any {
    // Robustness: handle SearchTool output directly
    let actualSources = Array.isArray(sources) ? sources : [];
    if (sources && typeof sources === 'object' && !Array.isArray(sources)) {
      if (Array.isArray(sources.results)) {
        actualSources = sources.results;
      }
    }

    // Map fields if they have different names (e.g., snippet -> content)
    const normalizedSources = actualSources.map((s: any) => ({
      content: s.content || s.snippet || JSON.stringify(s),
      title: s.title || 'Untitled Source',
      url: s.url || ''
    }));

    return {
      summary: `[SUMMARY OF ${normalizedSources.length} SOURCES${focus ? ' FOCUSED ON ' + focus : ''}]`,
      sourceCount: normalizedSources.length,
      citations: normalizedSources.map(s => ({ title: s.title, url: s.url }))
    };
  }

  private compare(facts: any): any {
    // Robustness: handle SearchTool output directly
    let actualFacts = Array.isArray(facts) ? facts : [];
    if (facts && typeof facts === 'object' && !Array.isArray(facts)) {
      if (Array.isArray(facts.results)) {
        actualFacts = facts.results;
      }
    }

    const normalizedFacts = actualFacts.map((f: any) => ({
      claim: f.claim || f.snippet || f.content || JSON.stringify(f),
      source: f.source || f.title || 'Unknown',
      url: f.url || ''
    }));

    return {
      comparison: `[COMPARISON OF ${normalizedFacts.length} CLAIMS]`,
      factCount: normalizedFacts.length,
      similarities: [],
      contradictions: []
    };
  }

  private generateReport(topic: string, findings: any[], includeCitations: boolean): any {
    return {
      report: `[RESEARCH REPORT FOR: ${topic}]`,
      findingCount: findings.length,
      hasCitations: includeCitations
    };
  }

  public async checkHealth(): Promise<ToolHealth> {
    return {
      status: 'healthy',
      lastChecked: new Date(),
      errorCount: 0
    };
  }
}
