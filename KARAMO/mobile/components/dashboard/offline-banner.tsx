import { Pressable, Text } from 'react-native';
import { WifiOff } from 'lucide-react-native';
import Animated, { SlideInUp } from 'react-native-reanimated';
import { colors, fonts } from '@/constants/theme';

type Props = {
  onRetry?: () => void;
};

export function OfflineBanner({ onRetry }: Props) {
  return (
    <Animated.View
      entering={SlideInUp.duration(200)}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: '#151518',
        borderWidth: 1,
        borderColor: '#27272A',
        borderLeftWidth: 4,
        borderLeftColor: colors.error,
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 16,
        marginBottom: 16,
      }}
    >
      <WifiOff size={18} color={colors.error} strokeWidth={1.75} />
      <Text
        style={{
          flex: 1,
          fontSize: 13,
          fontFamily: fonts.sans,
          color: colors.textSecondary,
          lineHeight: 18,
        }}
      >
        Connexion indisponible (données en cache)
      </Text>
      <Pressable onPress={onRetry} hitSlop={8}>
        <Text
          style={{
            fontSize: 13,
            fontFamily: fonts.sansMedium,
            color: colors.primary,
          }}
        >
          Réessayer
        </Text>
      </Pressable>
    </Animated.View>
  );
}
