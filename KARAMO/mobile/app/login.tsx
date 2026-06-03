import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { CoachLogo } from '@/components/coach-logo';
import { GoogleG } from '@/components/google-g';
import { ScreenFrame } from '@/components/screen-frame';
import { Btn } from '@/components/btn';
import { Toast } from '@/components/toast';
import { Robot } from '@/components/robot';
import { colors, type } from '@/constants/theme';
import { useAuth } from '@/lib/auth-context';

const ROBOT_MIN_DISPLAY_MS = 5000;

export default function Login() {
  const { user, signInWithGoogle, signingIn, authReady, lastError } = useAuth();
  const [robotMinUntil, setRobotMinUntil] = useState<number | null>(null);
  const [, forceRerender] = useState(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (user) router.replace('/permissions');
  }, [user]);

  // Re-render every 200ms while the minimum-display timer is active so we can
  // hide the robot exactly when the threshold is reached.
  useEffect(() => {
    if (robotMinUntil === null) return;
    tickRef.current = setInterval(() => forceRerender((n) => n + 1), 200);
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [robotMinUntil]);

  const onGooglePress = useCallback(async () => {
    setRobotMinUntil(Date.now() + ROBOT_MIN_DISPLAY_MS);
    await signInWithGoogle();
  }, [signInWithGoogle]);

  const minTimerStillActive = robotMinUntil !== null && Date.now() < robotMinUntil;
  const showRobot = signingIn || minTimerStillActive;

  if (showRobot) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <Robot />
        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 64,
            alignItems: 'center',
            paddingHorizontal: 24,
          }}
          pointerEvents="none"
        >
          <Text
            style={{
              ...type.bodyLarge,
              fontSize: 15,
              color: colors.textSecondary,
              textAlign: 'center',
            }}
          >
            Connexion en cours…
          </Text>
        </View>
      </View>
    );
  }

  return (
    <ScreenFrame>
      {lastError === 'failed' && <Toast message="Connexion impossible. Réessaie." />}
      <View style={{ height: 8 }} />
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Pressable
          onPress={() => router.back()}
          style={{
            width: 40,
            height: 40,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 12,
          }}
        >
          <ChevronLeft size={22} color={colors.text} strokeWidth={1.5} />
        </Pressable>
      </View>
      <View style={{ height: 40 }} />
      <CoachLogo size={56} />
      <View style={{ height: 40 }} />
      <Text style={{ ...type.h1, color: colors.text }}>Connecte-toi</Text>
      <View style={{ height: 12 }} />
      <Text style={{ ...type.bodyLarge, fontSize: 16, color: colors.textSecondary }}>
        Un seul compte Google suffit. Tes données restent privées et chiffrées.
      </Text>
      <View style={{ height: 40 }} />
      <Btn
        variant="google"
        onPress={onGooglePress}
        disabled={!authReady}
        leading={<GoogleG size={22} />}
      >
        Continuer avec Google
      </Btn>
      <View style={{ flex: 1, minHeight: 16 }} />
      <Text
        style={{
          ...type.caption,
          fontSize: 11,
          color: colors.textTertiary,
          textAlign: 'center',
          textTransform: 'none',
          letterSpacing: 0,
        }}
      >
        {'En continuant, tu acceptes nos '}
        <Text style={{ color: colors.primary }}>{"Conditions d'utilisation"}</Text>
        {'\net notre '}
        <Text style={{ color: colors.primary }}>Politique de confidentialité</Text>
        .
      </Text>
    </ScreenFrame>
  );
}

