import { useEffect } from 'react';
import { View, type DimensionValue } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/constants/theme';

type Side = 'user' | 'assistant';

function ShimmerBubble({
  side,
  width,
  height,
  marginTop,
}: {
  side: Side;
  width: DimensionValue;
  height: number;
  marginTop?: number;
}) {
  const t = useSharedValue(-1);

  useEffect(() => {
    t.value = withRepeat(
      withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.ease) }),
      -1,
      false,
    );
  }, [t]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: `${t.value * 100}%` as `${number}%` }],
  }));

  const isUser = side === 'user';

  return (
    <View
      style={{
        alignSelf: isUser ? 'flex-end' : 'flex-start',
        width,
        height,
        marginTop,
        backgroundColor: isUser ? 'rgba(74,83,255,0.18)' : colors.bgSurface,
        borderWidth: isUser ? 0 : 1,
        borderColor: colors.bgBorder,
        borderRadius: 20,
        borderBottomRightRadius: isUser ? 4 : 20,
        borderBottomLeftRadius: isUser ? 20 : 4,
        overflow: 'hidden',
      }}
    >
      <Animated.View style={[{ flex: 1 }, animatedStyle]}>
        <LinearGradient
          colors={['transparent', 'rgba(255,255,255,0.06)', 'transparent']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={{ flex: 1 }}
        />
      </Animated.View>
    </View>
  );
}

export function ChatSkeleton() {
  return (
    <View style={{ gap: 8 }}>
      <ShimmerBubble side="assistant" width="70%" height={64} />
      <ShimmerBubble side="user" width="55%" height={44} />
      <ShimmerBubble side="assistant" width="82%" height={96} />
      <ShimmerBubble side="user" width="40%" height={40} />
    </View>
  );
}
