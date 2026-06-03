import { Pressable, Text, View } from 'react-native';
import { colors, fonts } from '@/constants/theme';

type Props = {
  unreadCount: number;
  onMarkAll?: () => void;
};

export function ListHeader({ unreadCount, onMarkAll }: Props) {
  return (
    <View
      style={{
        height: 56,
        paddingHorizontal: 24,
        backgroundColor: colors.bg,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: colors.bgBorder,
      }}
    >
      <Text
        style={{
          fontSize: 22,
          fontFamily: fonts.sansSemiBold,
          color: colors.text,
          letterSpacing: -0.22,
        }}
      >
        Alertes
      </Text>
      {unreadCount > 0 && (
        <Pressable onPress={onMarkAll} hitSlop={8}>
          <Text
            style={{
              fontSize: 13,
              fontFamily: fonts.sansMedium,
              color: colors.primary,
              paddingVertical: 8,
            }}
          >
            Tout marquer lu
          </Text>
        </Pressable>
      )}
    </View>
  );
}
