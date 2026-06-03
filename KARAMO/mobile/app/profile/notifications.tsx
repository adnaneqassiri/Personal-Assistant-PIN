import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  AlertTriangle,
  ArrowRight,
  HeartPulse,
  Moon,
  TimerReset,
  Users,
} from 'lucide-react-native';
import { colors, fonts } from '@/constants/theme';
import { BackHeader } from '@/components/profile/back-header';
import { SectionCaps } from '@/components/profile/section-caps';
import { Switch } from '@/components/profile/switch';
import { ToggleCard } from '@/components/toggle-card';

export default function Notifications() {
  const insets = useSafeAreaInsets();
  const [prefs, setPrefs] = useState({
    health: true,
    productivity: true,
    meetings: true,
  });
  const [silent, setSilent] = useState(true);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
      <BackHeader title="Notifications" onBack={() => router.back()} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <SectionCaps>Catégories</SectionCaps>
        <View style={{ marginHorizontal: 24 }}>
          <ToggleCard
            c={colors.catHealth}
            icon={<HeartPulse size={22} color={colors.catHealth} strokeWidth={1.75} />}
            title="Santé"
            desc="Hydratation, posture, alertes critiques"
            on={prefs.health}
            onToggle={() => setPrefs(p => ({ ...p, health: !p.health }))}
          />
          <ToggleCard
            c={colors.catProductivity}
            icon={<TimerReset size={22} color={colors.catProductivity} strokeWidth={1.75} />}
            title="Productivité"
            desc="Pauses, distractions, focus"
            on={prefs.productivity}
            onToggle={() => setPrefs(p => ({ ...p, productivity: !p.productivity }))}
          />
          <ToggleCard
            c={colors.catMeeting}
            icon={<Users size={22} color={colors.catMeeting} strokeWidth={1.75} />}
            title="Réunion"
            desc="Synthèses, décisions, suivi"
            on={prefs.meetings}
            onToggle={() => setPrefs(p => ({ ...p, meetings: !p.meetings }))}
          />
        </View>

        <SectionCaps>Mode silencieux</SectionCaps>
        <View
          style={{
            marginHorizontal: 24,
            backgroundColor: colors.bgSurface,
            borderWidth: 1,
            borderColor: colors.bgBorder,
            borderRadius: 16,
            paddingVertical: 18,
            paddingHorizontal: 20,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <Moon size={20} color={colors.textSecondary} strokeWidth={1.75} />
            <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
              <Text
                style={{
                  fontSize: 15,
                  fontFamily: fonts.sansMedium,
                  color: colors.text,
                }}
              >
                Activer le mode silencieux
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  fontFamily: fonts.sans,
                  color: colors.textSecondary,
                }}
              >
                Aucune notif sauf urgences
              </Text>
            </View>
            <Switch on={silent} onChange={setSilent} />
          </View>
          {silent && (
            <View
              style={{
                marginTop: 16,
                paddingTop: 16,
                borderTopWidth: 1,
                borderTopColor: colors.bgBorder,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 14,
              }}
            >
              <TimeBlock label="Début" value="22:00" />
              <ArrowRight size={18} color={colors.textTertiary} strokeWidth={1.75} />
              <TimeBlock label="Fin" value="07:00" />
            </View>
          )}
        </View>

        <SectionCaps>Urgences</SectionCaps>
        <View
          style={{
            marginHorizontal: 24,
            backgroundColor: colors.bgSurface,
            borderWidth: 1,
            borderColor: colors.bgBorder,
            borderLeftWidth: 4,
            borderLeftColor: colors.error,
            borderRadius: 16,
            paddingVertical: 18,
            paddingHorizontal: 20,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              marginBottom: 6,
            }}
          >
            <AlertTriangle size={20} color={colors.error} strokeWidth={1.75} />
            <Text
              style={{
                fontSize: 15,
                fontFamily: fonts.sansSemiBold,
                color: colors.text,
              }}
            >
              Toujours actives
            </Text>
          </View>
          <Text
            style={{
              fontSize: 13,
              fontFamily: fonts.sans,
              color: colors.textSecondary,
              lineHeight: 19,
            }}
          >
            Les alertes critiques (chute, urgence santé) passent même en mode silencieux.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

function TimeBlock({ label, value }: { label: string; value: string }) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.bg,
        borderWidth: 1,
        borderColor: colors.bgBorder,
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 14,
        gap: 4,
      }}
    >
      <Text
        style={{
          fontSize: 11,
          fontFamily: fonts.sansSemiBold,
          color: colors.textTertiary,
          letterSpacing: 0.88,
          textTransform: 'uppercase',
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          fontFamily: fonts.mono,
          fontSize: 24,
          color: colors.text,
          fontVariant: ['tabular-nums'],
          letterSpacing: -0.24,
        }}
      >
        {value}
      </Text>
    </View>
  );
}
