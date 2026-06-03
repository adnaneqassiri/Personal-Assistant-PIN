import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  BarChart3,
  BellRing,
  Check,
  Download,
  FileCode,
  FileSpreadsheet,
  MessageCircle,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { colors, fonts } from '@/constants/theme';
import { Btn } from '@/components/btn';
import { Toast } from '@/components/toast';
import { BackHeader } from '@/components/profile/back-header';
import { SectionCaps } from '@/components/profile/section-caps';

type Period = '7d' | '30d' | 'custom';
type Format = 'csv' | 'json';

const PERIODS: { id: Period; label: string }[] = [
  { id: '7d', label: '7 derniers jours' },
  { id: '30d', label: '30 derniers jours' },
  { id: 'custom', label: 'Personnalisée' },
];

export default function Export() {
  const insets = useSafeAreaInsets();
  const [period, setPeriod] = useState<Period>('30d');
  const [format, setFormat] = useState<Format>('csv');
  const [items, setItems] = useState({
    alerts: true,
    conversations: true,
    habits: true,
  });
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

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
      {toastMsg && <Toast kind="warn" message={toastMsg} />}
      <BackHeader title="Export" onBack={() => router.back()} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <ExportHero />

        <SectionCaps>Période</SectionCaps>
        <View style={{ flexDirection: 'row', gap: 8, marginHorizontal: 24 }}>
          {PERIODS.map(p => (
            <Chip
              key={p.id}
              active={period === p.id}
              onPress={() => setPeriod(p.id)}
              label={p.label}
            />
          ))}
        </View>

        <SectionCaps>Format</SectionCaps>
        <View style={{ flexDirection: 'row', gap: 12, marginHorizontal: 24 }}>
          <RadioCard
            active={format === 'csv'}
            icon={FileSpreadsheet}
            color="#41FF31"
            title="CSV"
            desc="Excel, Google Sheets"
            onPress={() => setFormat('csv')}
          />
          <RadioCard
            active={format === 'json'}
            icon={FileCode}
            color="#9D5CFF"
            title="JSON"
            desc="Données brutes"
            onPress={() => setFormat('json')}
          />
        </View>

        <SectionCaps>Que souhaites-tu exporter ?</SectionCaps>
        <View style={{ marginHorizontal: 24, gap: 12 }}>
          <CheckCard
            active={items.alerts}
            icon={BellRing}
            title="Mes alertes"
            desc="Historique de notifications"
            onPress={() => setItems(s => ({ ...s, alerts: !s.alerts }))}
          />
          <CheckCard
            active={items.conversations}
            icon={MessageCircle}
            title="Mes conversations"
            desc="Échanges avec le coach"
            onPress={() => setItems(s => ({ ...s, conversations: !s.conversations }))}
          />
          <CheckCard
            active={items.habits}
            icon={BarChart3}
            title="Mes habitudes"
            desc="Données quotidiennes agrégées"
            onPress={() => setItems(s => ({ ...s, habits: !s.habits }))}
          />
        </View>

        <View style={{ marginTop: 32, marginHorizontal: 24 }}>
          <Btn
            variant="primary"
            onPress={() => showToast('Bientôt disponible')}
            leading={<Download size={20} color="#FFFFFF" strokeWidth={2} />}
          >
            Exporter
          </Btn>
        </View>
      </ScrollView>
    </View>
  );
}

function ExportHero() {
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
        style={{
          width: 96,
          height: 96,
          borderRadius: 24,
          backgroundColor: 'rgba(74,83,255,0.12)',
          borderWidth: 1,
          borderColor: 'rgba(74,83,255,0.32)',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 16,
        }}
      >
        <Download size={40} color={colors.primary} strokeWidth={1.75} />
      </View>
      <Text
        style={{
          fontSize: 22,
          fontFamily: fonts.sansSemiBold,
          color: colors.text,
          letterSpacing: -0.44,
          marginBottom: 6,
          textAlign: 'center',
        }}
      >
        Exporte tes données
      </Text>
      <Text
        style={{
          fontSize: 14,
          fontFamily: fonts.sans,
          color: colors.textSecondary,
          textAlign: 'center',
          lineHeight: 21,
          maxWidth: 280,
        }}
      >
        Récupère ton historique sous forme de fichier que tu peux ouvrir partout.
      </Text>
    </View>
  );
}

function Chip({
  active,
  label,
  onPress,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        height: 40,
        paddingHorizontal: 14,
        borderRadius: 12,
        backgroundColor: active
          ? 'rgba(74,83,255,0.12)'
          : pressed
            ? colors.bgElevated
            : colors.bgSurface,
        borderWidth: 1,
        borderColor: active ? colors.primary : colors.bgBorder,
        alignItems: 'center',
        justifyContent: 'center',
      })}
    >
      <Text
        numberOfLines={1}
        style={{
          fontSize: 13,
          fontFamily: fonts.sansMedium,
          color: active ? colors.text : colors.textSecondary,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function RadioCard({
  active,
  icon: Ic,
  color,
  title,
  desc,
  onPress,
}: {
  active: boolean;
  icon: LucideIcon;
  color: string;
  title: string;
  desc: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        backgroundColor: active
          ? 'rgba(74,83,255,0.06)'
          : pressed
            ? colors.bgElevated
            : colors.bgSurface,
        borderWidth: active ? 1.5 : 1,
        borderColor: active ? colors.primary : colors.bgBorder,
        borderRadius: 16,
        padding: active ? 17.5 : 18,
        gap: 8,
      })}
    >
      <Ic size={28} color={color} strokeWidth={1.75} />
      <Text
        style={{
          fontSize: 15,
          fontFamily: fonts.sansSemiBold,
          color: colors.text,
        }}
      >
        {title}
      </Text>
      <Text
        style={{
          fontSize: 12,
          fontFamily: fonts.sans,
          color: colors.textSecondary,
        }}
      >
        {desc}
      </Text>
    </Pressable>
  );
}

function CheckCard({
  active,
  icon: Ic,
  title,
  desc,
  onPress,
}: {
  active: boolean;
  icon: LucideIcon;
  title: string;
  desc: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: pressed ? colors.bgElevated : colors.bgSurface,
        borderWidth: 1,
        borderColor: colors.bgBorder,
        borderRadius: 16,
        paddingVertical: 16,
        paddingHorizontal: 18,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
      })}
    >
      <Ic size={20} color={colors.textSecondary} strokeWidth={1.75} />
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <Text
          style={{
            fontSize: 15,
            fontFamily: fonts.sansMedium,
            color: colors.text,
          }}
        >
          {title}
        </Text>
        <Text
          style={{
            fontSize: 12,
            fontFamily: fonts.sans,
            color: colors.textSecondary,
          }}
        >
          {desc}
        </Text>
      </View>
      <View
        style={{
          width: 24,
          height: 24,
          borderRadius: 7,
          borderWidth: 1.5,
          borderColor: active ? colors.primary : colors.bgBorder,
          backgroundColor: active ? colors.primary : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {active && <Check size={14} color="#FFFFFF" strokeWidth={2.5} />}
      </View>
    </Pressable>
  );
}
