import { Pressable, Text, View } from 'react-native';
import { BellRing, Droplet, Sparkles, Timer, Users } from 'lucide-react-native';
import { colors, fonts } from '@/constants/theme';
import { CAT_COLOR, CAT_ICON, CAT_LABEL } from '@/constants/dashboard-mock';
import type { AlertItem } from '@/constants/dashboard-mock';
import { SectionHeader } from './section-header';

const ICON_MAP = {
  Droplet,
  Timer,
  Users,
  Sparkles,
} as const;

type CardProps = AlertItem & {
  onPress?: () => void;
};

export function AlertCard({ category, title, body, time, onPress }: CardProps) {
  const Ic = ICON_MAP[CAT_ICON[category]] ?? BellRing;
  const color = CAT_COLOR[category];

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        backgroundColor: colors.bgSurface,
        borderWidth: 1,
        borderColor: colors.bgBorder,
        borderLeftWidth: 4,
        borderLeftColor: color,
        borderRadius: 16,
        paddingVertical: 16,
        paddingHorizontal: 20,
        transform: [{ scale: pressed ? 0.99 : 1 }],
      })}
    >
      <View style={{ marginTop: 2 }}>
        <Ic size={22} color={color} strokeWidth={1.75} />
      </View>
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <Text
          style={{
            fontSize: 11,
            fontFamily: fonts.sansSemiBold,
            color,
            letterSpacing: 0.88,
            textTransform: 'uppercase',
            lineHeight: 14,
          }}
        >
          {CAT_LABEL[category]}
        </Text>
        <Text
          style={{
            fontSize: 15,
            fontFamily: fonts.sansSemiBold,
            color: colors.text,
            letterSpacing: -0.15,
            lineHeight: 20,
          }}
        >
          {title}
        </Text>
        <Text
          numberOfLines={1}
          style={{
            fontSize: 13,
            fontFamily: fonts.sans,
            color: colors.textSecondary,
            lineHeight: 18,
          }}
        >
          {body}
        </Text>
      </View>
      <Text
        style={{
          fontFamily: fonts.mono,
          fontSize: 11,
          color: colors.textTertiary,
          fontVariant: ['tabular-nums'],
          marginTop: 2,
        }}
      >
        {time}
      </Text>
    </Pressable>
  );
}

type ListProps = {
  alerts: AlertItem[];
  onSeeAll?: () => void;
  onAlertPress?: (id: string) => void;
};

export function RecentAlertsSection({ alerts, onSeeAll, onAlertPress }: ListProps) {
  return (
    <View style={{ marginBottom: 16 }}>
      <SectionHeader caps="Alertes récentes" link="Voir tout" onLinkPress={onSeeAll} />
      <View style={{ gap: 12 }}>
        {alerts.map(a => (
          <AlertCard key={a.id} {...a} onPress={() => onAlertPress?.(a.id)} />
        ))}
      </View>
    </View>
  );
}
