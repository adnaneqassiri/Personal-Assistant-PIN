import { useEffect } from 'react';
import { View, ViewStyle, DimensionValue } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

type Props = {
  width?: DimensionValue;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
};

export function SkeletonLine({ width = '100%', height = 16, borderRadius = 6, style }: Props) {
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

  return (
    <View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: '#151518',
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Animated.View style={[{ flex: 1 }, animatedStyle]}>
        <LinearGradient
          colors={['transparent', 'rgba(255,255,255,0.05)', 'transparent']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={{ flex: 1 }}
        />
      </Animated.View>
    </View>
  );
}

type CircleProps = {
  size: number;
  style?: ViewStyle;
};

export function SkeletonCircle({ size, style }: CircleProps) {
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

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: '#151518',
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Animated.View style={[{ flex: 1 }, animatedStyle]}>
        <LinearGradient
          colors={['transparent', 'rgba(255,255,255,0.05)', 'transparent']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={{ flex: 1 }}
        />
      </Animated.View>
    </View>
  );
}
