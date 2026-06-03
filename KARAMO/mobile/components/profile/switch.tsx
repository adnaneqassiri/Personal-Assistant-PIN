import { Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
  interpolateColor,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import { colors } from '@/constants/theme';

type Props = {
  on: boolean;
  onChange: (next: boolean) => void;
};

export function Switch({ on, onChange }: Props) {
  const t = useSharedValue(on ? 1 : 0);

  useEffect(() => {
    t.value = withTiming(on ? 1 : 0, {
      duration: 200,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
    });
  }, [on, t]);

  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(t.value, [0, 1], [colors.bgBorder, colors.primary]),
  }));

  const knobStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: t.value * 20 }],
  }));

  return (
    <Pressable
      onPress={() => onChange(!on)}
      accessibilityRole="switch"
      accessibilityState={{ checked: on }}
      hitSlop={6}
    >
      <Animated.View
        style={[
          {
            width: 48,
            height: 28,
            borderRadius: 9999,
            position: 'relative',
          },
          trackStyle,
        ]}
      >
        <Animated.View
          style={[
            {
              position: 'absolute',
              top: 3,
              left: 3,
              width: 22,
              height: 22,
              borderRadius: 11,
              backgroundColor: '#FFFFFF',
              shadowColor: '#000',
              shadowOpacity: 0.25,
              shadowRadius: 4,
              shadowOffset: { width: 0, height: 2 },
              elevation: 2,
            },
            knobStyle,
          ]}
        />
      </Animated.View>
    </Pressable>
  );
}
