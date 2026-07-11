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
    if (prompt.includes('trip')) {
      return {
        id: crypto.randomUUID(),
        goal: 'Plan a trip',
        reasoning: 'The user wants to plan a trip, which requires flight, hotel, and weather information.',
        tasks: [
          { id: '1', description: 'search_flights', tool: 'search_flights', dependencies: [] },
          { id: '2', description: 'find_hotels', tool: 'find_hotels', dependencies: ['1'] },
          { id: '3', description: 'check_weather', tool: 'get_current_weather', dependencies: [] }
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
