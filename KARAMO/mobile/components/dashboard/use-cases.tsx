import { Pressable, Text, View } from 'react-native';
import { Droplet, PersonStanding, Sparkles, TimerReset, Users } from 'lucide-react-native';
import { colors, fonts } from '@/constants/theme';
import type { UseCaseItem } from '@/constants/dashboard-mock';
import { SectionHeader } from './section-header';

const ICON_MAP = {
  Droplet,
  PersonStanding,
  Users,
  TimerReset,
} as const;

type CardProps = UseCaseItem & {
  onPress?: () => void;
};

export function UseCaseCard({ icon, title, kpi, color, onPress }: CardProps) {
  const Ic = ICON_MAP[icon] ?? Sparkles;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => ({
        flex: 1,
        height: 120,
        backgroundColor: colors.bgSurface,
        borderWidth: 1,
        borderColor: colors.bgBorder,
        borderRadius: 16,
        padding: 16,
        flexDirection: 'column',
        opacity: pressed ? 0.9 : 1,
        transform: [{ scale: pressed ? 0.98 : 1 }],
      })}
    >
      <View style={{ marginBottom: 'auto' }}>
        <Ic size={24} color={color} strokeWidth={1.75} />
      </View>
      <Text
        style={{
          fontSize: 15,
          fontFamily: fonts.sansSemiBold,
          color: colors.text,
          letterSpacing: -0.15,
          marginTop: 12,
        }}
      >
        {title}
      </Text>
      <Text
        style={{
          fontSize: 13,
          fontFamily: fonts.sansMedium,
          color: colors.textSecondary,
          marginTop: 4,
          fontVariant: ['tabular-nums'],
        }}
      >
        {kpi}
      </Text>
    </Pressable>
  );
}

type GridProps = {
  items: UseCaseItem[];
  onItemPress?: (id: string) => void;
};

export function UseCaseGrid({ items, onItemPress }: GridProps) {
  return (
    <View style={{ marginBottom: 32 }}>
      <SectionHeader caps="Cas d'usage" />
      <View style={{ flexDirection: 'column', gap: 12 }}>
        {[0, 2].map(rowStart => (
          <View key={rowStart} style={{ flexDirection: 'row', gap: 12 }}>
            {items.slice(rowStart, rowStart + 2).map(it => (
              <UseCaseCard key={it.id} {...it} onPress={() => onItemPress?.(it.id)} />
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}
