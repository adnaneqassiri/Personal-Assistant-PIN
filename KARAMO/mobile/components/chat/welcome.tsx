import { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ArrowUpRight, Sparkles } from 'lucide-react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { colors, fonts } from '@/constants/theme';
import { SUGGESTIONS } from '@/constants/chat-mock';

type Props = {
  onPick: (suggestion: string) => void;
};

export function Welcome({ onPick }: Props) {
  return (
    <View>
      <View style={{ paddingTop: 24, paddingHorizontal: 8, paddingBottom: 24, gap: 4 }}>
        <Text
          style={{
            fontSize: 22,
            fontFamily: fonts.sansSemiBold,
            color: colors.text,
            letterSpacing: -0.44,
            lineHeight: 26,
          }}
        >
          Pose-moi une question
        </Text>
        <Text
          style={{
            fontSize: 14,
            fontFamily: fonts.sans,
            color: colors.textSecondary,
            lineHeight: 21,
          }}
        >
          Je connais ta semaine, demande-moi ce que tu veux.
        </Text>
      </View>
      <View style={{ gap: 12, paddingTop: 8, paddingBottom: 16 }}>
        {SUGGESTIONS.map((s, i) => (
          <SuggestionRow key={i} index={i} text={s} onPress={() => onPick(s)} />
        ))}
      </View>
    </View>
  );
}

function SuggestionRow({
  index,
  text,
  onPress,
}: {
  index: number;
  text: string;
  onPress: () => void;
}) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(8);

  useEffect(() => {
    const delay = index * 80;
    opacity.value = withDelay(
      delay,
      withTiming(1, { duration: 320, easing: Easing.out(Easing.ease) }),
    );
    translateY.value = withDelay(
      delay,
      withTiming(0, { duration: 320, easing: Easing.out(Easing.ease) }),
    );
  }, [index, opacity, translateY]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={style}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          backgroundColor: pressed ? '#131318' : colors.bgSurface,
          borderWidth: 1,
          borderColor: pressed ? 'rgba(157,92,255,0.36)' : colors.bgBorder,
          borderRadius: 16,
          paddingVertical: 16,
          paddingHorizontal: 18,
          transform: [{ scale: pressed ? 0.99 : 1 }],
        })}
      >
        <Sparkles size={20} color={colors.catRag} strokeWidth={1.75} />
        <Text
          style={{
            flex: 1,
            fontSize: 14,
            fontFamily: fonts.sansMedium,
            color: colors.text,
          }}
        >
          {text}
        </Text>
        <ArrowUpRight size={16} color={colors.textTertiary} strokeWidth={1.75} />
      </Pressable>
    </Animated.View>
  );
}
