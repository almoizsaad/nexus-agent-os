import type { LLMProvider } from './LLMProvider';

/**
 * A mock LLM provider for testing and development.
 */
export class MockLLMProvider implements LLMProvider {
  private mockResponse: unknown = null;

  public setMockResponse(response: unknown): void {
    this.mockResponse = response;
  }

  public async generateStructuredOutput<T>(prompt: string): Promise<T> {

    console.log(`[MockLLMProvider] Received prompt: ${prompt.substring(0, 100)}...`);
    
    if (this.mockResponse) {
      return this.mockResponse as T;
    }

    // Default mock response logic for planning
    if (prompt.includes('trip') || prompt.includes('Tokyo')) {
      return {
        id: crypto.randomUUID(),
        goal: 'Plan a trip to Tokyo',
        reasoning: 'The user wants to plan a trip to Tokyo, requiring flight, hotel, and attraction search.',
        tasks: [
          { id: '1', description: 'Search flights to Tokyo', tool: 'clock', dependencies: [] },
          { id: '2', description: 'Search hotels in Shinjuku', tool: 'filesystem', metadata: { operation: 'list_directory', path: '.' }, dependencies: ['1'] },
          { id: '3', description: 'Search top attractions', tool: 'clock', dependencies: [] }
        ]
      } as unknown as T;
    }

    if (prompt.includes('Research') || prompt.includes('Generative AI')) {
      return {
        id: crypto.randomUUID(),
        goal: 'Research Generative AI market',
        reasoning: 'Analyzing trends and players in GenAI requires market search and synthesis.',
        tasks: [
          { id: '1', description: 'Search GenAI trends 2026', tool: 'clock', dependencies: [] },
          { id: '2', description: 'Identify key market players', tool: 'filesystem', metadata: { operation: 'list_directory', path: '.' }, dependencies: ['1'] },
          { id: '3', description: 'Synthesize future projections', tool: 'clock', dependencies: [] }
        ]
      } as unknown as T;
    }

    if (prompt.includes('startup') || prompt.includes('solar')) {
      return {
        id: crypto.randomUUID(),
        goal: 'Design a solar energy startup',
        reasoning: 'Designing a startup involves market analysis and strategy mapping.',
        tasks: [
          { id: '1', description: 'Analyze solar energy market', tool: 'clock', dependencies: [] },
          { id: '2', description: 'Define operational strategy', tool: 'filesystem', metadata: { operation: 'list_directory', path: '.' }, dependencies: ['1'] },
          { id: '3', description: 'Project financial outcomes', tool: 'clock', dependencies: [] }
        ]
      } as unknown as T;
    }

    if (prompt.includes('production failure') || prompt.includes('root cause')) {
      return {
        id: crypto.randomUUID(),
        goal: 'Investigate a production failure',
        reasoning: 'Root cause analysis requires log analysis and system inspection.',
        tasks: [
          { id: '1', description: 'Check user service logs', tool: 'clock', dependencies: [] },
          { id: '2', description: 'Inspect resource usage', tool: 'filesystem', metadata: { operation: 'list_directory', path: '.' }, dependencies: ['1'] },
          { id: '3', description: 'Identify failure pattern', tool: 'clock', dependencies: [] }
        ]
      } as unknown as T;
    }

    if (prompt.includes('PostgreSQL') || prompt.includes('migration')) {
      return {
        id: crypto.randomUUID(),
        goal: 'Build a migration strategy for PostgreSQL',
        reasoning: 'Zero-downtime migration requires mapping source to destination and cutover plan.',
        tasks: [
          { id: '1', description: 'Assess source DB load', tool: 'clock', dependencies: [] },
          { id: '2', description: 'Validate destination Cloud SQL config', tool: 'filesystem', metadata: { operation: 'list_directory', path: '.' }, dependencies: ['1'] },
          { id: '3', description: 'Define replication lag thresholds', tool: 'clock', dependencies: [] }
        ]
      } as unknown as T;
    }

    throw new Error('[MockLLMProvider] No mock response configured for this prompt.');
  }

  public async embed(text: string): Promise<number[]> {
    const size = 128;
    const embedding = new Array(size).fill(0);
    const words = text.toLowerCase().split(/\W+/).filter(w => w.length > 0);

    for (const word of words) {
      let hash = 0;
      for (let i = 0; i < word.length; i++) {
        const char = word.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }

      for (let i = 0; i < size; i++) {
        const x = Math.sin(hash + i) * 10000;
        embedding[i] += x - Math.floor(x);
      }
    }

    // Normalize
    const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    if (norm > 0) {
      for (let i = 0; i < size; i++) {
        embedding[i] /= norm;
      }
    }

    return embedding;
  }
}
