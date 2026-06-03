import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { colors, radius } from '@/constants/theme';

export function Stepper({ step, total }: { step: number; total: number }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming((step / total) * 100, {
      duration: 400,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
    });
  }, [step, total, progress]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${progress.value}%`,
  }));

  return (
    <View
      style={{
        height: 4,
        backgroundColor: '#1F1F22',
        borderRadius: radius.pill,
        overflow: 'hidden',
        marginTop: 8,
      }}
    >
      <Animated.View
        style={[
          {
            height: '100%',
            backgroundColor: colors.primary,
            borderRadius: radius.pill,
          },
          fillStyle,
        ]}
      />
    </View>
  );
}
