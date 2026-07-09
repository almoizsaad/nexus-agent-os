import type { ChatMessage } from '@/lib/types/intent';

const API_KEY = import.meta.env.VITE_API_KEY;
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://api.moonshot.cn/v1';

if (!API_KEY) {
  console.warn('VITE_API_KEY not configured. AI features will use fallback mode.');
}

export async function* streamChatCompletion(messages: ChatMessage[]): AsyncGenerator<string> {
  if (!API_KEY) {
    yield '[API key not configured — switching to offline mode]';
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: 'moonshot-v1-8k',
        messages: messages.map(m => ({
          role: m.role,
          content: m.content,
        })),
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No reader available');

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed === 'data: [DONE]') continue;
        if (trimmed.startsWith('data: ')) {
          try {
            const data = JSON.parse(trimmed.slice(6));
            const content = data.choices?.[0]?.delta?.content;
            if (content) yield content;
          } catch {
            // Skip malformed JSON
          }
        }
      }
    }
  } catch (error) {
    console.error('Chat stream error:', error);
    yield '\n\n[Connection issue — switching to offline mode]';
  }
}

export async function analyzeIntentWithAI(input: string): Promise<{
  intent: string;
  confidence: number;
  reasoning: string;
}> {
  if (!API_KEY) {
    return {
      intent: 'chat',
      confidence: 50,
      reasoning: 'API key not configured — using fallback mode',
    };
  }

  try {
    const response = await fetch(`${API_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: 'moonshot-v1-8k',
        messages: [{
          role: 'system',
          content: `You are an intent analyzer. Analyze user input and respond ONLY with a JSON object in this format:
{"intent": "planning|booking|research|analysis|creation|comparison|chat", "confidence": 0-100, "reasoning": "brief explanation"}
No other text.`,
        }, {
          role: 'user',
          content: input,
        }],
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (content) {
      const parsed = JSON.parse(content);
      return {
        intent: parsed.intent || 'chat',
        confidence: parsed.confidence || 70,
        reasoning: parsed.reasoning || 'Intent detected via pattern matching',
      };
    }
  } catch (error) {
    console.error('Intent analysis error:', error);
  }

  return {
    intent: 'chat',
    confidence: 50,
    reasoning: 'Falling back to default chat mode due to analysis error',
  };
}
