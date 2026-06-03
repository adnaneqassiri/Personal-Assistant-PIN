import { Pressable, ScrollView, Text, View } from 'react-native';
import { colors, fonts } from '@/constants/theme';
import type { Category } from '@/constants/dashboard-mock';

export type ChipFilter = 'all' | Category;

type ChipDef = {
  id: ChipFilter;
  label: string;
  color?: string;
  textDark?: boolean;
};

const CHIPS: ChipDef[] = [
  { id: 'all',          label: 'Toutes' },
  { id: 'health',       label: 'Santé',        color: '#FF3B5C', textDark: false },
  { id: 'productivity', label: 'Productivité', color: '#FFB020', textDark: true },
  { id: 'meeting',      label: 'Réunion',      color: '#00C8E6', textDark: true },
  { id: 'rag',          label: 'RAG',          color: '#9D5CFF', textDark: false },
];

type Props = {
  active: ChipFilter;
  onChange: (next: ChipFilter) => void;
};

export function CategoryChips({ active, onChange }: Props) {
  return (
    <View style={{ paddingTop: 12, paddingBottom: 4, backgroundColor: colors.bg }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, gap: 8 }}
      >
        {CHIPS.map(c => {
          const isActive = active === c.id;
          const bg = isActive
            ? c.color ?? colors.primary
            : colors.bgSurface;
          const textColor = isActive
            ? c.textDark
              ? '#0A0A0F'
              : '#FFFFFF'
            : colors.textSecondary;

          return (
            <Pressable
              key={c.id}
              onPress={() => onChange(c.id)}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              style={({ pressed }) => ({
                height: 36,
                paddingHorizontal: 16,
                borderRadius: 9999,
                backgroundColor: bg,
                borderWidth: isActive ? 0 : 1,
                borderColor: colors.bgBorder,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                transform: [{ scale: pressed ? 0.96 : 1 }],
              })}
            >
              {!isActive && c.color && (
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: c.color,
                  }}
                />
              )}
              <Text
                style={{
                  fontSize: 13,
                  fontFamily: isActive ? fonts.sansSemiBold : fonts.sansMedium,
                  color: textColor,
                }}
              >
                {c.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
