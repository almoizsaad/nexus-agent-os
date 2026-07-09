import { Tool } from '../Tool';

/**
 * MockWeatherTool provides predictable weather data for testing purposes.
 */
export class MockWeatherTool implements Tool {
  public readonly name = 'get_current_weather';
  public readonly description = 'Returns current weather for a given city.';

  public async execute(input: { city: string }): Promise<{ temp: number; condition: string }> {
    console.log(`[MockWeatherTool] Fetching weather for ${input.city || 'unknown'}`);
    
    return {
      temp: 22,
      condition: 'Sunny',
    };
  }
}
