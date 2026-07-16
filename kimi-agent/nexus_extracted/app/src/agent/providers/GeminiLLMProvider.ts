import type { LLMProvider } from './LLMProvider';

export class GeminiLLMProvider implements LLMProvider {
  private apiKey: string;
  private apiBase: string;
  private model: string;

  constructor(
    apiKey: string = (typeof import.meta.env !== 'undefined' ? import.meta.env.VITE_GEMINI_API_KEY : process.env.VITE_GEMINI_API_KEY) || '',
    apiBase: string = 'https://generativelanguage.googleapis.com/v1beta',
    model: string = 'gemini-3.1-flash-lite'
  ) {
    this.apiKey = apiKey;
    this.apiBase = apiBase;
    this.model = model;

    if (!this.apiKey) {
      console.warn('[GeminiLLMProvider] API key not configured. Calls will fail.');
    }
  }

  public async generateStructuredOutput<T>(prompt: string, schema: unknown): Promise<T> {
    if (!this.apiKey) {
      throw new Error('[GeminiLLMProvider] API key not configured.');
    }

    try {
      const response = await fetch(`${this.apiBase}/models/${this.model}:generateContent?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            topP: 0.95,
            topK: 40,
            maxOutputTokens: 8192,
            responseMimeType: 'application/json',
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`[GeminiLLMProvider] API error: ${response.status} ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!content) {
        throw new Error('[GeminiLLMProvider] No content returned from API');
      }

      try {
        // Clean markdown if model ignored the instruction
        const cleaned = content.replace(/^```json\n?/, '').replace(/```$/, '').trim();
        return JSON.parse(cleaned) as T;
      } catch (parseError) {
        console.error('[GeminiLLMProvider] JSON parse error:', parseError, 'Content:', content);
        throw new Error('[GeminiLLMProvider] Failed to parse JSON response');
      }
    } catch (error) {
      console.error('[GeminiLLMProvider] Error generating structured output:', error);
      throw error;
    }
  }

  public async embed(text: string): Promise<number[]> {
    if (!this.apiKey) {
      throw new Error('[GeminiLLMProvider] API key not configured.');
    }

    try {
      const response = await fetch(`${this.apiBase}/models/gemini-embedding-2:embedContent?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'models/gemini-embedding-2',
          content: {
            parts: [{ text }],
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`[GeminiLLMProvider] Embedding API error: ${response.status}`);
      }

      const data = await response.json();
      return data.embedding.values;
    } catch (error) {
      console.error('[GeminiLLMProvider] Error generating embedding:', error);
      // Fallback to deterministic hash if embedding fails for any reason
      return this.fallbackEmbed(text);
    }
  }

  private fallbackEmbed(text: string): number[] {
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
