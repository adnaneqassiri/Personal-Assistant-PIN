import { useEffect } from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { Cpu } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { ScreenFrame } from '@/components/screen-frame';
import { Stepper } from '@/components/stepper';
import { HeroIcon } from '@/components/hero-icon';
import { Btn } from '@/components/btn';
import { colors, fonts, radius, type } from '@/constants/theme';
import { DEVICE } from '@/constants/profile-mock';

function PulseDot() {
  const opacity = useSharedValue(1);
  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.45, { duration: 750, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 750, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, [opacity]);
  const s = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return (
    <Animated.View
      style={[{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent }, s]}
    />
  );
}

export default function Device() {
  return (
    <ScreenFrame>
      <View style={{ height: 8 }} />
      <Stepper step={3} total={3} />
      <View style={{ height: 32 }} />
      <HeroIcon halo={colors.accent} motion="pulse">
        <Cpu size={88} color={colors.accent} strokeWidth={1.5} />
      </HeroIcon>
      <View style={{ height: 24 }} />
      <Text style={{ ...type.h1, color: colors.text, textAlign: 'center' }}>
        Ton boîtier est lié
      </Text>
      <View style={{ height: 12 }} />
      <Text style={{ ...type.bodyLarge, fontSize: 16, color: colors.textSecondary, textAlign: 'center' }}>
        {"L'appareil IoT associé à ton compte est prêt à observer."}
      </Text>
      <View style={{ height: 32 }} />
      <View
        style={{
          backgroundColor: colors.bgSurface,
          borderWidth: 1,
          borderColor: colors.bgBorder,
          borderRadius: radius.lg,
          padding: 20,
        }}
      >
        <Text
          style={{
            ...type.caption,
            fontSize: 11,
            color: colors.textTertiary,
            marginBottom: 14,
          }}
        >
          Boîtier associé
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Cpu size={18} color={colors.accent} strokeWidth={1.5} />
          <Text style={{ ...type.bodyLarge, fontSize: 15, color: colors.text }}>
            {DEVICE.type}
          </Text>
        </View>
        <View
          style={{
            marginTop: 12,
            backgroundColor: '#000',
            borderWidth: 1,
            borderColor: '#1F1F22',
            paddingVertical: 8,
            paddingHorizontal: 10,
            borderRadius: 8,
          }}
        >
          <Text style={{ fontFamily: fonts.mono, fontSize: 13, color: colors.textSecondary }}>
            device_id: {DEVICE.id}
          </Text>
        </View>
        <View
          style={{
            marginTop: 14,
            alignSelf: 'flex-start',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            paddingVertical: 6,
            paddingHorizontal: 12,
            backgroundColor: 'rgba(65,255,49,0.12)',
            borderRadius: radius.pill,
          }}
        >
          <PulseDot />
          <Text
            style={{
              ...type.caption,
              fontSize: 11,
              color: colors.accent,
            }}
          >
            EN LIGNE
          </Text>
        </View>
      </View>
      <View style={{ flex: 1, minHeight: 16 }} />
      <Btn variant="vital" onPress={() => router.replace('/home')}>
        Tout est prêt
      </Btn>
    </ScreenFrame>
  );
}
