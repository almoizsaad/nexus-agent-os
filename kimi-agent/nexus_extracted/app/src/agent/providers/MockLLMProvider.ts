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
    if (this.mockResponse) {
      return this.mockResponse as T;
    }

    // Default heuristics based on prompt keywords if no mock set
    if (prompt.toLowerCase().includes('trip') || prompt.toLowerCase().includes('tokyo')) {
      return {
        id: 'mock-plan-trip',
        goal: 'Plan a trip',
        reasoning: 'Planning a trip requires flights and hotels.',
        tasks: [
          { id: 'task_01', description: 'Search flights', tool: 'search_flights', dependencies: [] },
          { id: 'task_02', description: 'Find hotels', tool: 'find_hotels', dependencies: ['task_01'] }
        ]
      } as any as T;
    }

    if (prompt.toLowerCase().includes('research')) {
      return {
        id: 'mock-plan-research',
        goal: 'Research topic',
        reasoning: 'Researching requires searching and synthesis.',
        tasks: [
          { id: 'task_01', description: 'Research AI', tool: 'research_topic', metadata: { topic: 'AI Agents' }, dependencies: [] }
        ]
      } as any as T;
    }

    if (prompt.toLowerCase().includes('coding') || prompt.toLowerCase().includes('auth')) {
      return {
        id: 'mock-plan-coding',
        goal: 'Implement feature',
        reasoning: 'Coding requires writing and testing.',
        tasks: [
          { id: 'task_01', description: 'Write Auth', tool: 'write_code', metadata: { feature: 'Auth' }, dependencies: [] },
          { id: 'task_02', description: 'Run tests', tool: 'run_tests', dependencies: ['task_01'] }
        ]
      } as any as T;
    }

    if (prompt.toLowerCase().includes('ghost')) {
      return {
        id: 'mock-plan-fail',
        goal: 'Fail test',
        reasoning: 'Using a non-existent tool.',
        tasks: [
          { id: 'task_01', description: 'Ghost task', tool: 'ghost_tool', dependencies: [] }
        ]
      } as any as T;
    }

    if (prompt.toLowerCase().includes('cycle')) {
      return {
        id: 'mock-plan-cycle',
        goal: 'Cycle test',
        reasoning: 'Creating a circular dependency.',
        tasks: [
          { id: 'task_01', description: 'Task 1', tool: 'clock', dependencies: ['task_02'] },
          { id: 'task_02', description: 'Task 2', tool: 'clock', dependencies: ['task_01'] }
        ]
      } as any as T;
    }

    if (prompt.toLowerCase().includes('slow')) {
      return {
        id: 'mock-plan-slow',
        goal: 'Slow test',
        reasoning: 'Using a slow tool.',
        tasks: [
          { id: 'task_01', description: 'Slow task', tool: 'slow_tool', dependencies: [] }
        ]
      } as any as T;
    }

    if (prompt.toLowerCase().includes('flaky')) {
      return {
        id: 'mock-plan-flaky',
        goal: 'Flaky test',
        reasoning: 'Using a flaky tool.',
        tasks: [
          { id: 'task_01', description: 'Flaky task', tool: 'flaky_tool', dependencies: [] }
        ]
      } as any as T;
    }

    return {
      id: 'mock-plan-default',
      goal: 'Default goal',
      reasoning: 'Default mock reasoning.',
      tasks: [
        { id: 'task_01', description: 'Generic task', tool: 'clock', dependencies: [] }
      ]
    } as any as T;
  }

  public async generateText(prompt: string): Promise<string> {
    return `Mock text response for: ${prompt.substring(0, 50)}...`;
  }

  public async generateEmbedding(text: string): Promise<number[]> {
    const size = 1536;
    const embedding = new Array(size).fill(0).map(() => Math.random());
    const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map(v => v / (norm || 1));
  }
}
