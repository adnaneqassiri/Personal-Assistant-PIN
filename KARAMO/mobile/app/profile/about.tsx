import { useEffect, useRef, useState } from 'react';
import { Platform, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Code,
  FileText,
  Heart,
  Shield,
  Sparkles,
} from 'lucide-react-native';
import { colors, fonts } from '@/constants/theme';
import { TEAM, VERSION } from '@/constants/profile-mock';
import type { TeamMember } from '@/constants/profile-mock';
import { Toast } from '@/components/toast';
import { BackHeader } from '@/components/profile/back-header';
import { SectionCaps } from '@/components/profile/section-caps';
import { SettingsListItem } from '@/components/profile/settings-list-item';

export default function About() {
  const insets = useSafeAreaInsets();
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToastMsg(msg);
    toastTimer.current = setTimeout(() => setToastMsg(null), 2400);
  };

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  const onItemPress = () => showToast('Bientôt disponible');

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
      {toastMsg && <Toast kind="warn" message={toastMsg} />}
      <BackHeader title="À propos" onBack={() => router.back()} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 16 }}
      >
        <AboutHero />

        <SectionCaps>Équipe</SectionCaps>
        <View
          style={{
            marginHorizontal: 24,
            backgroundColor: colors.bgSurface,
            borderWidth: 1,
            borderColor: colors.bgBorder,
            borderRadius: 16,
            padding: 20,
          }}
        >
          <TeamSection member={TEAM.supervisor} big />
          <View style={{ height: 18 }} />
          <TeamSection member={TEAM.mobileLead} />
        </View>

        <SectionCaps>Documents légaux</SectionCaps>
        <Group>
          <SettingsListItem
            icon={FileText}
            label="Politique de confidentialité"
            onPress={onItemPress}
          />
          <SettingsListItem
            icon={FileText}
            label="Conditions d'utilisation"
            onPress={onItemPress}
          />
          <SettingsListItem
            icon={Shield}
            label="Sécurité et chiffrement"
            onPress={onItemPress}
            last
          />
        </Group>

        <SectionCaps>Open Source</SectionCaps>
        <Group>
          <SettingsListItem icon={Code} label="Code source" onPress={onItemPress} />
          <SettingsListItem
            icon={Heart}
            label="Licences open source"
            onPress={onItemPress}
            last
          />
        </Group>

        <Text
          style={{
            textAlign: 'center',
            paddingVertical: 32,
            paddingHorizontal: 24,
            fontSize: 12,
            fontFamily: fonts.sans,
            color: colors.textTertiary,
          }}
        >
          Coach AI · Construit avec attention
        </Text>
      </ScrollView>
    </View>
  );
}

function AboutHero() {
  return (
    <View
      style={{
        paddingTop: 32,
        paddingHorizontal: 24,
        paddingBottom: 8,
        alignItems: 'center',
      }}
    >
      <View
        style={Platform.select({
          ios: {
            shadowColor: '#4A53FF',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.32,
            shadowRadius: 24,
          },
          android: { elevation: 8 },
          default: {},
        })}
      >
        <LinearGradient
          colors={['#4A53FF', '#9D5CFF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            width: 64,
            height: 64,
            borderRadius: 18,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
          }}
        >
          <Sparkles size={32} color="#FFFFFF" strokeWidth={1.75} />
        </LinearGradient>
      </View>
      <Text
        style={{
          fontSize: 22,
          fontFamily: fonts.sansSemiBold,
          color: colors.text,
          letterSpacing: -0.22,
          marginBottom: 4,
        }}
      >
        Coach AI
      </Text>
      <Text
        style={{
          fontFamily: fonts.mono,
          fontSize: 13,
          color: colors.textSecondary,
          fontVariant: ['tabular-nums'],
        }}
      >
        Version {VERSION.number} (build {VERSION.build})
      </Text>
    </View>
  );
}

function TeamSection({ member, big }: { member: TeamMember; big?: boolean }) {
  return (
    <View>
      <Text
        style={{
          fontSize: 11,
          fontFamily: fonts.sansSemiBold,
          color: colors.textTertiary,
          letterSpacing: 0.88,
          textTransform: 'uppercase',
          marginBottom: 6,
        }}
      >
        {member.caps}
      </Text>
      <Text
        style={{
          fontSize: big ? 17 : 15,
          fontFamily: big ? fonts.sansSemiBold : fonts.sansMedium,
          color: colors.text,
          letterSpacing: -0.17,
        }}
      >
        {member.name}
      </Text>
    </View>
  );
}

function Group({ children }: { children: React.ReactNode }) {
  return (
    <View
      style={{
        marginHorizontal: 24,
        backgroundColor: colors.bgSurface,
        borderWidth: 1,
        borderColor: colors.bgBorder,
        borderRadius: 16,
        overflow: 'hidden',
      }}
    >
      {children}
    </View>
  );
}
