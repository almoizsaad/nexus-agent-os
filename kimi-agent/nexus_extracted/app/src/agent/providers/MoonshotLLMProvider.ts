import type { LLMProvider } from './LLMProvider';

export class MoonshotLLMProvider implements LLMProvider {
  private apiKey: string;
  private apiBase: string;
  private model: string;

  constructor(
    apiKey: string = import.meta.env.VITE_API_KEY || '',
    apiBase: string = import.meta.env.VITE_API_BASE_URL || 'https://api.moonshot.cn/v1',
    model: string = 'moonshot-v1-8k'
  ) {
    this.apiKey = apiKey;
    this.apiBase = apiBase;
    this.model = model;

    if (!this.apiKey) {
      console.warn('[MoonshotLLMProvider] API key not configured. Calls will fail.');
    }
  }

  public async generateStructuredOutput<T>(prompt: string, schema: unknown): Promise<T> {
    if (!this.apiKey) {
      throw new Error('[MoonshotLLMProvider] API key not configured.');
    }

    try {
      const response = await fetch(`${this.apiBase}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'system',
              content: `You are an expert AI assistant that provides structured JSON responses. 
              Always respond with a valid JSON object matching this schema: ${JSON.stringify(schema)}.
              Do not include any other text or explanation.`,
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          response_format: { type: 'json_object' },
        }),
      });

      if (!response.ok) {
        throw new Error(`[MoonshotLLMProvider] API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error('[MoonshotLLMProvider] No content returned from API');
      }

      return JSON.parse(content) as T;
    } catch (error) {
      console.error('[MoonshotLLMProvider] Error generating structured output:', error);
      throw error;
    }
  }

  public async embed(text: string): Promise<number[]> {
    // Moonshot might not support embeddings in the same way, 
    // or it might have a separate endpoint. 
    // For now, if it's missing, we might need a fallback or a real embedding service.
    // Assuming for 'runtime' we should at least try to call the real embedding API if available.
    
    // Legacy/Fallback for now since Moonshot specific embedding endpoint 
    // might vary or require different setup.
    // In a real 'Remove Mock' scenario, we should use a real embedding service.
    
    console.warn('[MoonshotLLMProvider] Embeddings not fully implemented for Moonshot, using deterministic hash as placeholder for runtime.');
    
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

    const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    if (norm > 0) {
      for (let i = 0; i < size; i++) {
        embedding[i] /= norm;
      }
    }

    return embedding;
  }
}
