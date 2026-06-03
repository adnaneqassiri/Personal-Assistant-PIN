import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/constants/theme';
import {
  type Conversation,
  type ConvId,
  type Group,
  type Message,
} from '@/constants/chat-mock';
import type { TabId } from '@/constants/dashboard-mock';
import { dispatchTab } from '@/lib/tab-nav';
import { useAuth } from '@/lib/auth-context';
import { askCoach, type ChatHistoryItem } from '@/lib/chat-service';
import { loadChatState, saveChatState } from '@/lib/chat-storage';
import { Toast } from '@/components/toast';
import { TabBar } from '@/components/dashboard/tab-bar';
import { ChatHeader } from '@/components/chat/chat-header';
import { Welcome } from '@/components/chat/welcome';
import { AssistantBubble, UserBubble } from '@/components/chat/bubble';
import { Composer } from '@/components/chat/composer';
import { ConversationDrawer } from '@/components/chat/drawer';

function nowTime(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function newId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function computeGroup(createdAt: number | undefined): Group {
  if (!createdAt) return 'today';
  const created = new Date(createdAt);
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  if (created.getTime() >= todayStart) return 'today';
  const weekStart = todayStart - 7 * 24 * 60 * 60 * 1000;
  if (created.getTime() >= weekStart) return 'week';
  return 'older';
}

function makeTitle(question: string): string {
  const cleaned = question.trim().replace(/\s+/g, ' ');
  if (cleaned.length <= 42) return cleaned;
  return `${cleaned.slice(0, 42)}…`;
}

function makePreview(text: string): string {
  const cleaned = text.trim().replace(/\s+/g, ' ');
  if (cleaned.length <= 90) return cleaned;
  return `${cleaned.slice(0, 90)}…`;
}

export default function Chat() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [hydrated, setHydrated] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messagesByConv, setMessagesByConv] = useState<Record<ConvId, Message[]>>({});
  const [activeConvId, setActiveConvId] = useState<ConvId | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollRef = useRef<ScrollView | null>(null);

  // Load persisted state once on mount.
  useEffect(() => {
    (async () => {
      const state = await loadChatState();
      setConversations(state.conversations);
      setMessagesByConv(state.messagesByConv);
      setHydrated(true);
    })();
  }, []);

  // Recompute groups every time we render (in case time has passed).
  const conversationsWithGroup = useMemo(
    () =>
      conversations.map((c) => ({
        ...c,
        group: computeGroup(c.createdAt),
      })),
    [conversations],
  );

  // Persist whenever state changes (after hydration).
  useEffect(() => {
    if (!hydrated) return;
    saveChatState({ conversations, messagesByConv });
  }, [hydrated, conversations, messagesByConv]);

  const showToast = useCallback((msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToastMsg(msg);
    toastTimer.current = setTimeout(() => setToastMsg(null), 2400);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  const messages: Message[] = useMemo(
    () => (activeConvId ? messagesByConv[activeConvId] ?? [] : []),
    [messagesByConv, activeConvId],
  );

  const conversationTitle = useMemo(() => {
    if (!activeConvId) return 'Nouvelle conversation';
    const conv = conversationsWithGroup.find((c) => c.id === activeConvId);
    return conv?.title ?? 'Conversation';
  }, [activeConvId, conversationsWithGroup]);

  const isNewMode = activeConvId === null;

  useEffect(() => {
    const id = setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 60);
    return () => clearTimeout(id);
  }, [messages.length, activeConvId, busy]);

  const sendQuestion = useCallback(
    async (text: string) => {
      const userMsg: Message = {
        id: newId('u'),
        role: 'user',
        text,
        time: nowTime(),
      };
      const pendingId = newId('a');
      const pendingMsg: Message = {
        id: pendingId,
        role: 'assistant',
        text: '',
        time: '',
        streaming: true,
      };

      // Resolve target conversation: existing or fresh.
      let convId = activeConvId;
      let isFirstInConv = false;

      if (!convId) {
        convId = newId('c');
        isFirstInConv = true;
        const newConv: Conversation = {
          id: convId,
          title: makeTitle(text),
          preview: 'Réflexion…',
          time: nowTime(),
          group: 'today',
          count: 1,
          createdAt: Date.now(),
        };
        setConversations((prev) => [newConv, ...prev]);
        setActiveConvId(convId);
      }

      const targetConvId = convId;

      const historyBefore = messagesByConv[targetConvId] ?? [];
      setMessagesByConv((prev) => ({
        ...prev,
        [targetConvId]: [...(prev[targetConvId] ?? []), userMsg, pendingMsg],
      }));
      setBusy(true);

      const history: ChatHistoryItem[] = historyBefore.map((m) => ({
        role: m.role,
        text: m.text,
      }));

      try {
        const reply = await askCoach(text, {
          userName: user?.givenName ?? user?.name,
          history,
        });

        setMessagesByConv((prev) => ({
          ...prev,
          [targetConvId]: (prev[targetConvId] ?? []).map((m) =>
            m.id === pendingId
              ? {
                  ...m,
                  text: reply.text,
                  time: nowTime(),
                  streaming: false,
                  sources: reply.source === 'groq' ? 1 : undefined,
                }
              : m,
          ),
        }));

        setConversations((prev) =>
          prev.map((c) =>
            c.id === targetConvId
              ? {
                  ...c,
                  preview: makePreview(reply.text),
                  time: nowTime(),
                  count: isFirstInConv ? 2 : c.count + 2,
                }
              : c,
          ),
        );

        if (reply.source === 'fallback' && reply.errorKind === 'missing-key') {
          showToast('Clé Groq manquante — réponse hors-ligne');
        } else if (reply.source === 'fallback') {
          showToast('Connexion lente — réponse depuis le cache');
        }
      } catch {
        setMessagesByConv((prev) => ({
          ...prev,
          [targetConvId]: (prev[targetConvId] ?? []).filter((m) => m.id !== pendingId),
        }));
        showToast('Une erreur est survenue, réessaie');
      } finally {
        setBusy(false);
      }
    },
    [activeConvId, messagesByConv, user?.givenName, user?.name, showToast],
  );

  const handleSend = useCallback(
    (text: string) => {
      if (text === '__stop__' || busy) return;
      const trimmed = text.trim();
      if (!trimmed) return;
      sendQuestion(trimmed);
    },
    [busy, sendQuestion],
  );

  const handleTabPress = (t: TabId) => dispatchTab(t, 'chat', showToast);

  const onNewConv = () => {
    setActiveConvId(null);
  };

  const onSelectConv = (id: ConvId) => {
    setActiveConvId(id);
    setDrawerOpen(false);
  };

  const onWelcomePick = (text: string) => {
    handleSend(text);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
      {toastMsg && <Toast kind="warn" message={toastMsg} />}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ChatHeader
          title={conversationTitle}
          onMenu={() => setDrawerOpen(true)}
          onPlus={onNewConv}
        />
        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 16,
            paddingBottom: 8,
            gap: 4,
          }}
        >
          {isNewMode && messages.length === 0 && <Welcome onPick={onWelcomePick} />}
          {messages.map((m, i) => {
            if (m.role === 'user') {
              return <UserBubble key={m.id} text={m.text} time={m.time} />;
            }
            const prev = messages[i - 1];
            const showLabel = !prev || prev.role !== 'assistant';
            return (
              <AssistantBubble
                key={m.id}
                text={m.text}
                time={m.time}
                streaming={m.streaming}
                sources={m.sources}
                showLabel={showLabel}
                onSourcesPress={() => showToast('Sources : Dashboard, alertes du jour')}
              />
            );
          })}
        </ScrollView>
        <Composer
          streaming={busy}
          onSend={handleSend}
        />
      </KeyboardAvoidingView>
      <TabBar active="chat" onTabPress={handleTabPress} />
      {drawerOpen && (
        <ConversationDrawer
          activeId={activeConvId}
          conversations={conversationsWithGroup}
          onClose={() => setDrawerOpen(false)}
          onSelect={onSelectConv}
          onNew={() => {
            onNewConv();
            setDrawerOpen(false);
          }}
        />
      )}
    </View>
  );
}
