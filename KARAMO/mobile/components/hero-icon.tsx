import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';

type Props = {
  halo?: string;
  children: React.ReactNode;
  motion?: 'oscillate' | 'pulse' | 'none';
};

export function HeroIcon({ halo = '#4A53FF', children, motion = 'none' }: Props) {
  const rotate = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    if (motion === 'oscillate') {
      rotate.value = withRepeat(
        withSequence(
          withTiming(6, { duration: 650, easing: Easing.bezier(0.4, 0, 0.2, 1) }),
          withTiming(0, { duration: 650, easing: Easing.bezier(0.4, 0, 0.2, 1) }),
          withTiming(-6, { duration: 650, easing: Easing.bezier(0.4, 0, 0.2, 1) }),
          withTiming(0, { duration: 650, easing: Easing.bezier(0.4, 0, 0.2, 1) }),
        ),
        -1,
        false,
      );
    } else if (motion === 'pulse') {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 1000, easing: Easing.bezier(0.4, 0, 0.2, 1) }),
          withTiming(1, { duration: 1000, easing: Easing.bezier(0.4, 0, 0.2, 1) }),
        ),
        -1,
        false,
      );
    }
  }, [motion, rotate, scale]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotate.value}deg` }, { scale: scale.value }],
  }));

  return (
    <View
      style={{
        width: 200,
        height: 200,
        alignSelf: 'center',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <View
        style={{
          position: 'absolute',
          width: 200,
          height: 200,
          borderRadius: 100,
          backgroundColor: halo,
          opacity: 0.18,
        }}
      />
      <View
        style={{
          position: 'absolute',
          width: 140,
          height: 140,
          borderRadius: 70,
          borderWidth: 1,
          borderColor: halo + '40',
        }}
      />
      <Animated.View style={animStyle}>{children}</Animated.View>
    </View>
  );
}
