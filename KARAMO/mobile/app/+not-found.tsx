import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { Btn } from '@/components/btn';
import { Robot } from '@/components/robot';
import { colors, type } from '@/constants/theme';

export default function NotFound() {
  const insets = useSafeAreaInsets();

  return (
    <>
      <Stack.Screen options={{ title: 'Introuvable' }} />
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <View style={{ flex: 1 }}>
          <Robot />
        </View>
        <View
          style={{
            paddingHorizontal: 24,
            paddingTop: 24,
            paddingBottom: insets.bottom + 24,
            gap: 12,
            backgroundColor: colors.bg,
          }}
        >
          <Text
            style={{
              ...type.h1,
              fontSize: 24,
              color: colors.text,
              textAlign: 'center',
            }}
          >
            Page introuvable
          </Text>
          <Text
            style={{
              ...type.bodyLarge,
              fontSize: 14,
              color: colors.textSecondary,
              textAlign: 'center',
              marginBottom: 12,
            }}
          >
            404 — Cette page n'existe pas (ou plus). Choisis où tu veux repartir.
          </Text>
          <Btn variant="primary" onPress={() => router.replace('/home')}>
            Retour au dashboard
          </Btn>
          <Btn variant="secondary" onPress={() => router.replace('/login')}>
            Retour au login
          </Btn>
        </View>
      </View>
    </>
  );
}
