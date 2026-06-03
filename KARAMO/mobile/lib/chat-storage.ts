import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Conversation, ConvId, Message } from '@/constants/chat-mock';

const STORAGE_KEY = '@coach-ai/chat-state-v1';

export type StoredChatState = {
  conversations: Conversation[];
  messagesByConv: Record<ConvId, Message[]>;
};

export async function loadChatState(): Promise<StoredChatState> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return { conversations: [], messagesByConv: {} };
    const parsed = JSON.parse(raw) as StoredChatState;
    return {
      conversations: Array.isArray(parsed.conversations) ? parsed.conversations : [],
      messagesByConv:
        parsed.messagesByConv && typeof parsed.messagesByConv === 'object'
          ? parsed.messagesByConv
          : {},
    };
  } catch {
    return { conversations: [], messagesByConv: {} };
  }
}

export async function saveChatState(state: StoredChatState): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // best-effort; if storage fails we keep state in memory
  }
}

export async function clearChatState(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
