import { useState } from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { HeartPulse, Timer, Users } from 'lucide-react-native';
import { ScreenFrame } from '@/components/screen-frame';
import { Stepper } from '@/components/stepper';
import { ToggleCard } from '@/components/toggle-card';
import { Btn } from '@/components/btn';
import { colors, type } from '@/constants/theme';

type Prefs = { health: boolean; productivity: boolean; meetings: boolean };

export default function Preferences() {
  const [v, setV] = useState<Prefs>({ health: true, productivity: true, meetings: true });
  const t = (k: keyof Prefs) => setV((s) => ({ ...s, [k]: !s[k] }));
  const anyOn = v.health || v.productivity || v.meetings;

  return (
    <ScreenFrame>
      <View style={{ height: 8 }} />
      <Stepper step={2} total={3} />
      <View style={{ height: 36 }} />
      <Text style={{ ...type.h1, color: colors.text }}>
        Quelles alertes{'\n'}tu veux ?
      </Text>
      <View style={{ height: 12 }} />
      <Text style={{ ...type.bodyLarge, fontSize: 16, color: colors.textSecondary }}>
        {"Active les catégories qui t'intéressent. Tu pourras tout changer plus tard."}
      </Text>
      <View style={{ height: 28 }} />
      <View>
        <ToggleCard
          c={colors.catHealth}
          icon={<HeartPulse size={22} color={colors.catHealth} strokeWidth={1.5} />}
          title="Santé"
          desc="Hydratation, posture, sédentarité"
          on={v.health}
          onToggle={() => t('health')}
        />
        <ToggleCard
          c={colors.catProductivity}
          icon={<Timer size={22} color={colors.catProductivity} strokeWidth={1.5} />}
          title="Productivité"
          desc="Dépassement de tâche, distractions"
          on={v.productivity}
          onToggle={() => t('productivity')}
        />
        <ToggleCard
          c={colors.catMeeting}
          icon={<Users size={22} color={colors.catMeeting} strokeWidth={1.5} />}
          title="Réunion"
          desc="Synthèses automatiques, décisions clés"
          on={v.meetings}
          onToggle={() => t('meetings')}
        />
      </View>
      <View style={{ flex: 1, minHeight: 16 }} />
      <Btn disabled={!anyOn} onPress={() => router.push('/device')}>
        Continuer
      </Btn>
    </ScreenFrame>
  );
}
