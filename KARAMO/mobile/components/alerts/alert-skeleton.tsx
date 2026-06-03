import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

export function AlertSkeleton() {
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
      style={{
        marginHorizontal: 24,
        marginBottom: 12,
        height: 88,
        borderRadius: 16,
        backgroundColor: '#151518',
        overflow: 'hidden',
      }}
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
