import { Text } from 'react-native';
import { colors, fonts } from '@/constants/theme';

export function SectionCaps({ children }: { children: string }) {
  return (
    <Text
      style={{
        paddingTop: 16,
        paddingHorizontal: 24,
        paddingBottom: 8,
        fontSize: 11,
        fontFamily: fonts.sansSemiBold,
        color: colors.textTertiary,
        letterSpacing: 0.88,
        textTransform: 'uppercase',
      }}
    >
      {children}
    </Text>
  );
}
