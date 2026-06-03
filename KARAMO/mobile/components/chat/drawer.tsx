import { useMemo, useState } from 'react';
import {
  Pressable,
  type SectionListData,
  SectionList,
  Text,
  TextInput,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MessageCircleDashed, Plus, Search, Sparkles, X } from 'lucide-react-native';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInLeft,
  SlideOutLeft,
} from 'react-native-reanimated';
import { colors, fonts } from '@/constants/theme';
import {
  type Conversation,
  type ConvId,
  GROUP_LABEL,
  type Group,
} from '@/constants/chat-mock';

type Section = {
  title: Group;
  data: Conversation[];
};

type Props = {
  activeId: ConvId | null;
  conversations: Conversation[];
  onClose: () => void;
  onSelect: (id: ConvId) => void;
  onNew: () => void;
};

export function ConversationDrawer({ activeId, conversations, onClose, onSelect, onNew }: Props) {
  const [search, setSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

  const sections: Section[] = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = q
      ? conversations.filter(c => c.title.toLowerCase().includes(q))
      : conversations;
    const grouped: Record<Group, Conversation[]> = { today: [], week: [], older: [] };
    for (const c of list) grouped[c.group].push(c);
    const out: Section[] = [];
    (['today', 'week', 'older'] as Group[]).forEach(g => {
      if (grouped[g].length > 0) out.push({ title: g, data: grouped[g] });
    });
    return out;
  }, [search, conversations]);

  const showEmpty = sections.length === 0 && !search;

  return (
    <>
      <Animated.View
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(150)}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 100,
        }}
      >
        <Pressable
          onPress={onClose}
          accessibilityLabel="Fermer"
          style={{ flex: 1 }}
        />
      </Animated.View>
      <Animated.View
        entering={SlideInLeft.duration(280)}
        exiting={SlideOutLeft.duration(200)}
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 0,
          width: '80%',
          backgroundColor: colors.bg,
          borderRightWidth: 1,
          borderRightColor: colors.bgBorder,
          zIndex: 101,
        }}
      >
        <View
          style={{
            height: 56,
            paddingVertical: 8,
            paddingHorizontal: 16,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <LinearGradient
            colors={['#4A53FF', '#9D5CFF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Sparkles size={18} color="#FFFFFF" strokeWidth={1.75} />
          </LinearGradient>
          <Text
            style={{
              flex: 1,
              fontSize: 18,
              fontFamily: fonts.sansSemiBold,
              color: colors.text,
              letterSpacing: -0.18,
            }}
          >
            Mes conversations
          </Text>
          <Pressable
            onPress={onClose}
            accessibilityLabel="Fermer"
            style={({ pressed }) => ({
              width: 40,
              height: 40,
              borderRadius: 12,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: pressed ? 'rgba(255,255,255,0.04)' : 'transparent',
            })}
          >
            <X size={20} color={colors.textSecondary} strokeWidth={1.75} />
          </Pressable>
        </View>

        <Pressable
          onPress={onNew}
          accessibilityRole="button"
          style={({ pressed }) => ({
            marginHorizontal: 16,
            marginBottom: 16,
            height: 48,
            backgroundColor: colors.primary,
            borderRadius: 12,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            transform: [{ scale: pressed ? 0.99 : 1 }],
          })}
        >
          <Plus size={18} color="#FFFFFF" strokeWidth={2} />
          <Text
            style={{
              fontSize: 15,
              fontFamily: fonts.sansSemiBold,
              color: '#FFFFFF',
            }}
          >
            Nouvelle conversation
          </Text>
        </Pressable>

        <View
          style={{
            marginHorizontal: 16,
            marginBottom: 16,
            height: 48,
            backgroundColor: colors.bgSurface,
            borderWidth: searchFocused ? 1.5 : 1,
            borderColor: searchFocused ? colors.primary : colors.bgBorder,
            borderRadius: 12,
            paddingHorizontal: searchFocused ? 15.5 : 16,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <Search size={20} color={colors.textTertiary} strokeWidth={1.75} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            placeholder="Rechercher une conversation"
            placeholderTextColor={colors.textTertiary}
            style={{
              flex: 1,
              fontSize: 15,
              fontFamily: fonts.sans,
              color: colors.text,
              padding: 0,
            }}
          />
          {search.length > 0 && (
            <Pressable
              onPress={() => setSearch('')}
              hitSlop={6}
              accessibilityLabel="Effacer"
              style={{ padding: 4 }}
            >
              <X size={16} color={colors.textTertiary} strokeWidth={2} />
            </Pressable>
          )}
        </View>

        {showEmpty ? (
          <View
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              paddingHorizontal: 32,
              paddingVertical: 40,
            }}
          >
            <MessageCircleDashed size={48} color={colors.textTertiary} strokeWidth={1.5} />
            <Text
              style={{
                fontSize: 17,
                fontFamily: fonts.sansSemiBold,
                color: colors.text,
                letterSpacing: -0.17,
                textAlign: 'center',
              }}
            >
              {"Tu n'as pas encore de conversation"}
            </Text>
            <Text
              style={{
                fontSize: 14,
                fontFamily: fonts.sans,
                color: colors.textSecondary,
                lineHeight: 21,
                textAlign: 'center',
                maxWidth: 240,
              }}
            >
              Pose ta première question à ton coach.
            </Text>
          </View>
        ) : (
          <SectionList
            sections={sections}
            keyExtractor={c => c.id}
            stickySectionHeadersEnabled
            showsVerticalScrollIndicator={false}
            renderSectionHeader={({ section }: { section: SectionListData<Conversation, Section> }) => (
              <View
                style={{
                  backgroundColor: colors.bg,
                  paddingTop: 12,
                  paddingHorizontal: 16,
                  paddingBottom: 6,
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontFamily: fonts.sansSemiBold,
                    color: colors.textTertiary,
                    letterSpacing: 0.88,
                    textTransform: 'uppercase',
                  }}
                >
                  {GROUP_LABEL[section.title]}
                </Text>
              </View>
            )}
            renderItem={({ item }) => (
              <DrawerItem
                conversation={item}
                active={item.id === activeId}
                onPress={() => onSelect(item.id)}
              />
            )}
          />
        )}
      </Animated.View>
    </>
  );
}

function DrawerItem({
  conversation,
  active,
  onPress,
}: {
  conversation: Conversation;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderLeftWidth: 3,
        borderLeftColor: active ? colors.primary : 'transparent',
        backgroundColor: active
          ? '#151518'
          : pressed
            ? 'rgba(255,255,255,0.03)'
            : 'transparent',
      })}
    >
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <Text
          numberOfLines={1}
          style={{
            fontSize: 15,
            fontFamily: fonts.sansMedium,
            color: colors.text,
            letterSpacing: -0.15,
          }}
        >
          {conversation.title}
        </Text>
        <Text
          numberOfLines={1}
          style={{
            fontSize: 12,
            fontFamily: fonts.sans,
            color: colors.textSecondary,
          }}
        >
          {conversation.preview}
        </Text>
      </View>
      <Text
        style={{
          fontFamily: fonts.mono,
          fontSize: 11,
          color: colors.textTertiary,
          fontVariant: ['tabular-nums'],
          marginTop: 2,
        }}
      >
        {conversation.time}
      </Text>
    </Pressable>
  );
}
