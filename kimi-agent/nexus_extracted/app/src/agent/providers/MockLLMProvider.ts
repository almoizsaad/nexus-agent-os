import type { LLMProvider } from './LLMProvider';

/**
 * A mock LLM provider for testing and development.
 */
export class MockLLMProvider implements LLMProvider {
  private mockResponse: any = null;

  public setMockResponse(response: any): void {
    this.mockResponse = response;
  }

  public async generateStructuredOutput<T>(prompt: string, _schema: any): Promise<T> {
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
}
