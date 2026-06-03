import { useEffect } from 'react';
import { View } from 'react-native';
import { Droplet, Sparkles, TimerReset, Users } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import type { Category } from '@/constants/dashboard-mock';
import { CAT_HERO_ICON } from '@/constants/alerts-mock';
import { CAT_COLOR } from '@/constants/dashboard-mock';

const ICON_MAP = {
  Droplet,
  TimerReset,
  Users,
  Sparkles,
} as const;

const SIZE = 200;
const RING_SIZE = 140;

type Props = {
  category: Category;
};

function withAlpha(hex: string, alpha: number) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function HeroIcon({ category }: Props) {
  const Ic = ICON_MAP[CAT_HERO_ICON[category]];
  const color = CAT_COLOR[category];

  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withTiming(1, {
      duration: 420,
      easing: Easing.bezier(0.34, 1.56, 0.64, 1),
    });
    opacity.value = withTiming(1, {
      duration: 420,
      easing: Easing.out(Easing.ease),
    });
  }, [scale, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          width: SIZE,
          height: SIZE,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 24,
        },
        animatedStyle,
      ]}
    >
      <View
        style={{
          position: 'absolute',
          width: SIZE,
          height: SIZE,
          borderRadius: SIZE / 2,
          backgroundColor: color,
          opacity: 0.18,
        }}
      />
      <View
        style={{
          position: 'absolute',
          width: RING_SIZE,
          height: RING_SIZE,
          borderRadius: RING_SIZE / 2,
          borderWidth: 1,
          borderColor: withAlpha(color, 0.25),
        }}
      />
      <Ic size={88} color={color} strokeWidth={1.5} />
    </Animated.View>
  );
}
