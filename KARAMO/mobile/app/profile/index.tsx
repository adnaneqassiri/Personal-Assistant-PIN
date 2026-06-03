import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  BellRing,
  Download,
  Info,
  LogOut,
  Palette,
  Trash2,
} from 'lucide-react-native';
import { colors, fonts } from '@/constants/theme';
import { VERSION } from '@/constants/profile-mock';
import type { TabId } from '@/constants/dashboard-mock';
import { dispatchTab } from '@/lib/tab-nav';
import { useAuth } from '@/lib/auth-context';
import { Toast } from '@/components/toast';
import { TabBar } from '@/components/dashboard/tab-bar';
import { UserCard } from '@/components/profile/user-card';
import { DeviceCard } from '@/components/profile/device-card';
import { SectionCaps } from '@/components/profile/section-caps';
import { SettingsListItem } from '@/components/profile/settings-list-item';

export default function ProfileMain() {
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleLogout = async () => {
    await signOut();
    router.replace('/welcome');
  };

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

  const handleTabPress = (tab: TabId) => dispatchTab(tab, 'profile', showToast);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
      {toastMsg && <Toast kind="warn" message={toastMsg} />}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <UserCard />
        <DeviceCard />

        <SectionCaps>Compte</SectionCaps>
        <Group>
          <SettingsListItem
            icon={BellRing}
            label="Préférences notifications"
            value="Santé, Productivité, Réunion"
            onPress={() => router.push('/profile/notifications')}
          />
          <SettingsListItem
            icon={Download}
            label="Export de mes données"
            onPress={() => router.push('/profile/export')}
          />
          <SettingsListItem
            icon={Info}
            label="À propos"
            value={`v${VERSION.number}`}
            onPress={() => router.push('/profile/about')}
            last
          />
        </Group>

        <SectionCaps>Apparence</SectionCaps>
        <Group>
          <SettingsListItem
            icon={Palette}
            label="Mode"
            value="Sombre"
            last
            noChevron
          />
        </Group>

        <View style={{ marginTop: 32, marginHorizontal: 24, gap: 12 }}>
          <GhostButton
            icon={<LogOut size={20} color={colors.text} strokeWidth={1.75} />}
            label={user ? 'Déconnexion' : 'Déconnexion (aucun compte)'}
            onPress={user ? handleLogout : () => showToast('Aucun compte connecté')}
          />
          <DangerButton
            icon={<Trash2 size={20} color={colors.error} strokeWidth={1.75} />}
            label="Supprimer mon compte"
            onPress={() => showToast('Bientôt disponible')}
          />
        </View>
      </ScrollView>
      <TabBar active="profile" onTabPress={handleTabPress} />
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

function GhostButton({
  icon,
  label,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        width: '100%',
        height: 56,
        backgroundColor: pressed ? colors.bgElevated : colors.bgSurface,
        borderWidth: 1,
        borderColor: colors.bgBorder,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        transform: [{ scale: pressed ? 0.99 : 1 }],
      })}
    >
      {icon}
      <Text
        style={{
          fontSize: 15,
          fontFamily: fonts.sansMedium,
          color: colors.text,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function DangerButton({
  icon,
  label,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        width: '100%',
        height: 56,
        backgroundColor: pressed ? 'rgba(255,59,92,0.06)' : 'transparent',
        borderWidth: 1,
        borderColor: pressed ? 'rgba(255,59,92,0.5)' : 'rgba(255,59,92,0.3)',
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        transform: [{ scale: pressed ? 0.99 : 1 }],
      })}
    >
      {icon}
      <Text
        style={{
          fontSize: 15,
          fontFamily: fonts.sansMedium,
          color: colors.error,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
