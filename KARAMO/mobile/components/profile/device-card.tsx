import { useEffect } from 'react';
import { Text, View } from 'react-native';
import { Cpu } from 'lucide-react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { colors, fonts } from '@/constants/theme';
import { DEVICE } from '@/constants/profile-mock';

function PulseDot() {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.4, { duration: 750, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 750, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, [opacity]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        {
          width: 6,
          height: 6,
          borderRadius: 3,
          backgroundColor: colors.accent,
        },
        style,
      ]}
    />
  );
}

export function DeviceCard() {
  return (
    <View
      style={{
        marginTop: 24,
        marginHorizontal: 24,
        backgroundColor: colors.bgSurface,
        borderWidth: 1,
        borderColor: colors.bgBorder,
        borderRadius: 16,
        padding: 20,
      }}
    >
      <Text
        style={{
          fontSize: 11,
          fontFamily: fonts.sansSemiBold,
          color: colors.textTertiary,
          letterSpacing: 0.88,
          textTransform: 'uppercase',
          marginBottom: 12,
        }}
      >
        Boîtier associé
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <Cpu size={24} color={colors.accent} strokeWidth={1.75} />
        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
          <Text
            style={{
              fontSize: 15,
              fontFamily: fonts.sansMedium,
              color: colors.text,
              lineHeight: 20,
            }}
          >
            {DEVICE.type}
          </Text>
          <Text
            style={{
              fontFamily: fonts.mono,
              fontSize: 12,
              color: colors.textSecondary,
              fontVariant: ['tabular-nums'],
            }}
          >
            {DEVICE.id}
          </Text>
          <View
            style={{
              alignSelf: 'flex-start',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              marginTop: 6,
              paddingVertical: 4,
              paddingHorizontal: 10,
              backgroundColor: 'rgba(65,255,49,0.10)',
              borderRadius: 9999,
            }}
          >
            <PulseDot />
            <Text
              style={{
                fontSize: 11,
                fontFamily: fonts.sansSemiBold,
                color: colors.accent,
                letterSpacing: 0.66,
                textTransform: 'uppercase',
              }}
            >
              En ligne
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}
