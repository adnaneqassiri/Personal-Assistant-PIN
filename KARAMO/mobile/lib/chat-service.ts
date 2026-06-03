import { groqChat, GroqError, type ChatMessage } from './groq-client';
import { buildSystemPrompt } from './rag-context';
import { fallbackAnswer } from './fallback-chat';

export type CoachReply = {
  text: string;
  source: 'groq' | 'fallback';
  errorKind?: GroqError['kind'];
};

export type ChatHistoryItem = {
  role: 'user' | 'assistant';
  text: string;
};

export type AskCoachOptions = {
  userName?: string;
  history?: ChatHistoryItem[];
  signal?: AbortSignal;
};

function todayLabel(): string {
  return new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export async function askCoach(question: string, opts: AskCoachOptions = {}): Promise<CoachReply> {
  const systemPrompt = buildSystemPrompt({
    userName: opts.userName,
    todayDate: todayLabel(),
  });

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    ...(opts.history ?? []).slice(-6).map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.text,
    })),
    { role: 'user', content: question },
  ];

  try {
    const res = await groqChat(messages, { signal: opts.signal });
    return { text: res.text, source: 'groq' };
  } catch (e) {
    const kind = e instanceof GroqError ? e.kind : 'network';
    return {
      text: fallbackAnswer(question),
      source: 'fallback',
      errorKind: kind,
    };
  }
}
