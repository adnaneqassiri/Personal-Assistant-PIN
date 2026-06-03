import { Pressable, Text, View } from 'react-native';
import { BellRing, Droplet, Sparkles, Timer, Users } from 'lucide-react-native';
import { colors, fonts } from '@/constants/theme';
import { CAT_COLOR, CAT_ICON, CAT_LABEL } from '@/constants/dashboard-mock';
import type { Alert } from '@/constants/alerts-mock';

const ICON_MAP = {
  Droplet,
  Timer,
  Users,
  Sparkles,
} as const;

type Props = {
  alert: Alert;
  unread: boolean;
  onPress?: () => void;
};

export function AlertRow({ alert, unread, onPress }: Props) {
  const Ic = ICON_MAP[CAT_ICON[alert.category]] ?? BellRing;
  const color = CAT_COLOR[alert.category];

  return (
    <View style={{ marginHorizontal: 24, marginBottom: 12 }}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: 12,
          backgroundColor: unread ? '#13131B' : colors.bgSurface,
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
            {CAT_LABEL[alert.category]}
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
            {alert.title}
          </Text>
          <Text
            numberOfLines={2}
            style={{
              fontSize: 13,
              fontFamily: fonts.sans,
              color: colors.textSecondary,
              lineHeight: 18,
            }}
          >
            {alert.body}
          </Text>
        </View>
        <View
          style={{
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            gap: 12,
            minHeight: 38,
            marginTop: 2,
          }}
        >
          <Text
            style={{
              fontFamily: fonts.mono,
              fontSize: 11,
              color: colors.textTertiary,
              fontVariant: ['tabular-nums'],
            }}
          >
            {alert.time}
          </Text>
          {unread && (
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: colors.primary,
              }}
            />
          )}
        </View>
      </Pressable>
    </View>
  );
}
