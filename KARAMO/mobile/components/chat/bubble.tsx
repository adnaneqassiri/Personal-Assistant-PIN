import { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ChevronRight, Database, Sparkles } from 'lucide-react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { colors, fonts } from '@/constants/theme';

export function UserBubble({ text, time }: { text: string; time?: string }) {
  return (
    <View style={{ alignItems: 'flex-end', gap: 4, marginBottom: 4 }}>
      <View
        style={{
          maxWidth: '80%',
          paddingVertical: 12,
          paddingHorizontal: 16,
          backgroundColor: colors.primary,
          borderRadius: 20,
          borderBottomRightRadius: 4,
        }}
      >
        <Text
          style={{
            fontSize: 15,
            fontFamily: fonts.sans,
            color: '#FFFFFF',
            lineHeight: 22,
          }}
        >
          {text}
        </Text>
      </View>
      {!!time && <Timestamp value={time} />}
    </View>
  );
}

type AssistantProps = {
  text: string;
  time?: string;
  streaming?: boolean;
  showLabel?: boolean;
  sources?: number;
  onSourcesPress?: () => void;
};

export function AssistantBubble({
  text,
  time,
  streaming,
  showLabel,
  sources,
  onSourcesPress,
}: AssistantProps) {
  return (
    <View style={{ alignItems: 'flex-start', gap: 4, marginBottom: 4 }}>
      {showLabel && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            marginTop: 8,
            marginHorizontal: 4,
            marginBottom: 4,
          }}
        >
          <Sparkles size={14} color={colors.catRag} strokeWidth={1.75} />
          <Text
            style={{
              fontSize: 11,
              fontFamily: fonts.sansSemiBold,
              color: colors.catRag,
              letterSpacing: 0.88,
              textTransform: 'uppercase',
            }}
          >
            Coach
          </Text>
        </View>
      )}
      <View
        style={{
          maxWidth: '85%',
          paddingVertical: 14,
          paddingHorizontal: 18,
          backgroundColor: colors.bgSurface,
          borderWidth: 1,
          borderColor: colors.bgBorder,
          borderRadius: 20,
          borderBottomLeftRadius: 4,
          flexDirection: 'row',
          alignItems: 'flex-end',
        }}
      >
        <Text
          style={{
            fontSize: 15,
            fontFamily: fonts.sans,
            color: colors.text,
            lineHeight: 22,
            flexShrink: 1,
          }}
        >
          {text}
        </Text>
        {streaming && <BlinkCursor />}
      </View>
      {!!sources && !streaming && (
        <Pressable
          onPress={onSourcesPress}
          style={({ pressed }) => ({
            marginTop: 8,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            backgroundColor: pressed ? '#1a1a1f' : colors.bgElevated,
            borderWidth: 1,
            borderColor: colors.bgBorder,
            borderRadius: 12,
            paddingVertical: 10,
            paddingHorizontal: 14,
          })}
        >
          <Database size={16} color={colors.catRag} strokeWidth={1.75} />
          <Text
            style={{
              fontSize: 12,
              fontFamily: fonts.sansMedium,
              color: colors.textSecondary,
            }}
          >
            {sources} sources utilisées
          </Text>
          <ChevronRight size={16} color={colors.textTertiary} strokeWidth={1.75} />
        </Pressable>
      )}
      {!!time && !streaming && <Timestamp value={time} />}
    </View>
  );
}

function BlinkCursor() {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(withTiming(0, { duration: 300 }), withTiming(1, { duration: 300 })),
      -1,
      false,
    );
  }, [opacity]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        {
          width: 2,
          height: 18,
          backgroundColor: colors.primary,
          marginLeft: 2,
          marginBottom: 2,
        },
        style,
      ]}
    />
  );
}

function Timestamp({ value }: { value: string }) {
  return (
    <Text
      style={{
        fontFamily: fonts.mono,
        fontSize: 11,
        color: colors.textTertiary,
        marginHorizontal: 4,
        fontVariant: ['tabular-nums'],
      }}
    >
      {value}
    </Text>
  );
}
