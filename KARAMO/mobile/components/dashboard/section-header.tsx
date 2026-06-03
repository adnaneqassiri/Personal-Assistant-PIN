import { Pressable, Text, View } from 'react-native';
import { ArrowRight } from 'lucide-react-native';
import { colors, fonts } from '@/constants/theme';

type Props = {
  caps: string;
  link?: string;
  onLinkPress?: () => void;
};

export function SectionHeader({ caps, link, onLinkPress }: Props) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
      }}
    >
      <Text
        style={{
          fontSize: 12,
          fontFamily: fonts.sansSemiBold,
          color: colors.textTertiary,
          letterSpacing: 0.96,
          textTransform: 'uppercase',
        }}
      >
        {caps}
      </Text>
      {link && (
        <Pressable
          onPress={onLinkPress}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4 }}
          hitSlop={8}
        >
          <Text
            style={{
              fontSize: 12,
              fontFamily: fonts.sansMedium,
              color: colors.primary,
              letterSpacing: 0.72,
              textTransform: 'uppercase',
            }}
          >
            {link}
          </Text>
          <ArrowRight size={12} color={colors.primary} strokeWidth={2} />
        </Pressable>
      )}
    </View>
  );
}
