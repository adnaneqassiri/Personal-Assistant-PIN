import { Text } from 'react-native';
import { AlertTriangle, WifiOff } from 'lucide-react-native';
import Animated, { SlideInUp } from 'react-native-reanimated';
import { colors, fonts } from '@/constants/theme';

type Variant = 'rag-error' | 'offline';

const COPY: Record<Variant, { Icon: typeof AlertTriangle; text: string; color: string }> = {
  'rag-error': {
    Icon: AlertTriangle,
    text: 'Le coach est temporairement indisponible',
    color: '#FF3B5C',
  },
  offline: {
    Icon: WifiOff,
    text: 'Mode hors ligne : tu peux relire tes conversations',
    color: '#FFB020',
  },
};

export function ChatBanner({ variant }: { variant: Variant }) {
  const { Icon, text, color } = COPY[variant];

  return (
    <Animated.View
      entering={SlideInUp.duration(200)}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 10,
        paddingHorizontal: 16,
        backgroundColor: colors.bgSurface,
        borderLeftWidth: 4,
        borderLeftColor: color,
        borderBottomWidth: 1,
        borderBottomColor: colors.bgBorder,
      }}
    >
      <Icon size={18} color={color} strokeWidth={1.75} />
      <Text
        style={{
          flex: 1,
          fontSize: 13,
          fontFamily: fonts.sansMedium,
          color: colors.text,
        }}
      >
        {text}
      </Text>
    </Animated.View>
  );
}
