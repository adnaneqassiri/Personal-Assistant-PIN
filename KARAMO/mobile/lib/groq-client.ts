export type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export type GroqCompletion = {
  text: string;
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
};

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_MODEL = 'llama-3.3-70b-versatile';
const DEFAULT_TIMEOUT_MS = 12000;

export class GroqError extends Error {
  constructor(
    message: string,
    public readonly kind: 'missing-key' | 'network' | 'http' | 'parse' | 'timeout',
    public readonly status?: number,
  ) {
    super(message);
    this.name = 'GroqError';
  }
}

export async function groqChat(
  messages: ChatMessage[],
  opts: { model?: string; temperature?: number; maxTokens?: number; signal?: AbortSignal } = {},
): Promise<GroqCompletion> {
  const apiKey = process.env.EXPO_PUBLIC_GROQ_API_KEY;
  if (!apiKey || apiKey.startsWith('REPLACE_ME')) {
    throw new GroqError('GROQ API key is not configured', 'missing-key');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
  const signal = opts.signal ?? controller.signal;

  let res: Response;
  try {
    res = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: opts.model ?? DEFAULT_MODEL,
        messages,
        temperature: opts.temperature ?? 0.4,
        max_tokens: opts.maxTokens ?? 512,
        stream: false,
      }),
      signal,
    });
  } catch (e) {
    clearTimeout(timeout);
    const isAbort = (e as Error)?.name === 'AbortError';
    throw new GroqError(
      isAbort ? 'GROQ request timed out' : 'Network error contacting GROQ',
      isAbort ? 'timeout' : 'network',
    );
  }

  clearTimeout(timeout);

  if (!res.ok) {
    throw new GroqError(`GROQ HTTP error ${res.status}`, 'http', res.status);
  }

  let data: any;
  try {
    data = await res.json();
  } catch {
    throw new GroqError('Failed to parse GROQ response', 'parse');
  }

  const text: string | undefined = data?.choices?.[0]?.message?.content;
  if (!text) {
    throw new GroqError('Empty completion from GROQ', 'parse');
  }

  return {
    text: text.trim(),
    model: data?.model ?? DEFAULT_MODEL,
    usage: data?.usage,
  };
}
