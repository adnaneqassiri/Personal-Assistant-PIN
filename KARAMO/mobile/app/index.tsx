import { useEffect } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { colors } from '@/constants/theme';
import { Robot } from '@/components/robot';

const SPLASH_DURATION_MS = 5000;

export default function Splash() {
  useEffect(() => {
    const t = setTimeout(() => router.replace('/welcome'), SPLASH_DURATION_MS);
    return () => clearTimeout(t);
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Pressable
        onPress={() => router.replace('/welcome')}
        accessibilityLabel="Passer l'introduction"
        style={{ flex: 1 }}
      >
        <Robot />
      </Pressable>
    </View>
  );
}
