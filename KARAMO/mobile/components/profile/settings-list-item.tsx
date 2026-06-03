import { Pressable, Text } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { colors, fonts } from '@/constants/theme';

type Props = {
  icon: LucideIcon;
  label: string;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
  last?: boolean;
  noChevron?: boolean;
};

export function SettingsListItem({
  icon: Ic,
  label,
  value,
  onPress,
  danger,
  last,
  noChevron,
}: Props) {
  const labelColor = danger ? colors.error : colors.text;
  const leadColor = danger ? colors.error : colors.textSecondary;

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => ({
        minHeight: 56,
        paddingVertical: 14,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        backgroundColor: pressed ? colors.bgElevated : 'transparent',
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: colors.bgBorder,
      })}
    >
      <Ic size={20} color={leadColor} strokeWidth={1.75} />
      <Text
        style={{
          flex: 1,
          fontSize: 15,
          fontFamily: fonts.sansMedium,
          color: labelColor,
          letterSpacing: -0.15,
        }}
      >
        {label}
      </Text>
      {value && (
        <Text
          numberOfLines={1}
          style={{
            fontSize: 14,
            fontFamily: fonts.sans,
            color: colors.textSecondary,
            maxWidth: '50%',
          }}
        >
          {value}
        </Text>
      )}
      {!danger && !noChevron && (
        <ChevronRight size={20} color={colors.textTertiary} strokeWidth={1.75} />
      )}
    </Pressable>
  );
}
