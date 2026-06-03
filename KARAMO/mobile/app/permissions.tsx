import { useState } from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { BellRing, Droplet, Timer, Users } from 'lucide-react-native';
import { ScreenFrame } from '@/components/screen-frame';
import { Stepper } from '@/components/stepper';
import { HeroIcon } from '@/components/hero-icon';
import { Btn } from '@/components/btn';
import { Toast } from '@/components/toast';
import { colors, radius, type } from '@/constants/theme';

export default function Permissions() {
  const [refused, setRefused] = useState(false);

  return (
    <ScreenFrame>
      {refused && <Toast kind="warn" message="Sans notifications, tu rateras les alertes en arrière-plan." />}
      <View style={{ height: 8 }} />
      <Stepper step={1} total={3} />
      <View style={{ height: 32 }} />
      <HeroIcon halo={colors.primary} motion="oscillate">
        <BellRing size={88} color={colors.primary} strokeWidth={1.5} />
      </HeroIcon>
      <View style={{ height: 24 }} />
      <Text style={{ ...type.h1, color: colors.text, textAlign: 'center' }}>
        Active les notifications
      </Text>
      <View style={{ height: 12 }} />
      <Text style={{ ...type.bodyLarge, fontSize: 16, color: colors.textSecondary, textAlign: 'center' }}>
        On a besoin de pouvoir te prévenir en temps réel quand quelque chose mérite ton attention.
      </Text>
      <View style={{ height: 32 }} />
      <View
        style={{
          backgroundColor: colors.bgSurface,
          borderWidth: 1,
          borderColor: colors.bgBorder,
          borderRadius: radius.lg,
          padding: 20,
          gap: 14,
        }}
      >
        <Row icon={<Droplet size={18} color={colors.primary} strokeWidth={1.5} />} label="Rappel d'hydratation" />
        <Row icon={<Timer size={18} color={colors.warning} strokeWidth={1.5} />} label="Dépassement de tâche" />
        <Row icon={<Users size={18} color={colors.info} strokeWidth={1.5} />} label="Synthèse de réunion" />
      </View>
      <View style={{ flex: 1, minHeight: 16 }} />
      <Btn
        leading={<BellRing size={20} color="#fff" strokeWidth={1.5} />}
        onPress={() => router.push('/preferences')}
      >
        Activer les notifications
      </Btn>
      <View style={{ height: 4 }} />
      <Btn
        variant="ghost"
        onPress={() => {
          if (!refused) {
            setRefused(true);
            return;
          }
          router.push('/preferences');
        }}
      >
        {refused ? 'Continuer quand même' : 'Plus tard'}
      </Btn>
    </ScreenFrame>
  );
}

function Row({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      {icon}
      <Text style={{ ...type.bodySmall, fontSize: 14, color: colors.text }}>{label}</Text>
    </View>
  );
}
