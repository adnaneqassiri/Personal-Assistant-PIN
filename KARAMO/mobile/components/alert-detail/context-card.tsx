import { Text, View } from 'react-native';
import { Activity, Clock, Eye, MapPin, Volume2 } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { colors, fonts } from '@/constants/theme';
import type { AlertContext } from '@/constants/alerts-mock';

type Row = {
  Icon: LucideIcon;
  label: string;
  value: string;
  color: string;
};

type Props = {
  ctx: AlertContext;
};

export function ContextCard({ ctx }: Props) {
  const rows: Row[] = [
    { Icon: Eye,      label: 'Activité détectée', value: ctx.activity,   color: '#4A53FF' },
    { Icon: Volume2,  label: 'Audio',             value: ctx.audio,      color: '#00C8E6' },
    { Icon: MapPin,   label: 'Lieu',              value: ctx.location,   color: '#FFB020' },
    { Icon: Clock,    label: 'Durée',             value: ctx.duration,   color: '#41FF31' },
    { Icon: Activity, label: 'Confiance LLM',     value: ctx.confidence, color: '#9D5CFF' },
  ];

  return (
    <View
      style={{
        backgroundColor: colors.bgSurface,
        borderWidth: 1,
        borderColor: colors.bgBorder,
        borderRadius: 16,
        padding: 20,
        gap: 14,
      }}
    >
      {rows.map((r, i) => (
        <View
          key={i}
          style={{
            flexDirection: 'row',
            alignItems: 'flex-start',
            gap: 12,
          }}
        >
          <View style={{ width: 16, marginTop: 2 }}>
            <r.Icon size={16} color={r.color} strokeWidth={1.75} />
          </View>
          <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
            <Text
              style={{
                fontSize: 11,
                fontFamily: fonts.sansSemiBold,
                color: colors.textTertiary,
                letterSpacing: 0.88,
                textTransform: 'uppercase',
              }}
            >
              {r.label}
            </Text>
            <Text
              style={{
                fontSize: 14,
                fontFamily: fonts.sansMedium,
                color: colors.text,
                lineHeight: 20,
              }}
            >
              {r.value}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}
