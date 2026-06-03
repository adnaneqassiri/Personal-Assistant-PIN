import { ActivityIndicator, Pressable, Text } from 'react-native';
import { colors, radius, type } from '@/constants/theme';

type Variant = 'primary' | 'google' | 'vital' | 'ghost' | 'secondary';

type Props = {
  variant?: Variant;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
  leading?: React.ReactNode;
  style?: object;
};

export function Btn({ variant = 'primary', onPress, disabled, loading, children, leading, style }: Props) {
  const palette = (() => {
    switch (variant) {
      case 'google':
        return { bg: '#FFFFFF', fg: '#0A0A0F', height: 56, weight: type.body.fontFamily };
      case 'vital':
        return { bg: colors.accent, fg: '#0A0A0F', height: 56, weight: type.h3.fontFamily };
      case 'ghost':
        return { bg: 'transparent', fg: colors.textSecondary, height: 48, weight: type.body.fontFamily };
      case 'secondary':
        return { bg: colors.bgSurface, fg: colors.text, height: 56, weight: type.h3.fontFamily, border: colors.bgBorder };
      default:
        return { bg: colors.primary, fg: '#FFFFFF', height: 56, weight: type.h3.fontFamily };
    }
  })();

  return (
    <Pressable
      onPress={disabled || loading ? undefined : onPress}
      style={({ pressed }) => [
        {
          width: '100%',
          height: palette.height,
          borderRadius: radius.lg,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          backgroundColor: palette.bg,
          borderWidth: palette.border ? 1 : 0,
          borderColor: palette.border,
          opacity: disabled ? 0.4 : 1,
          transform: [{ scale: pressed && !disabled ? 0.98 : 1 }],
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={palette.fg} />
      ) : (
        <>
          {leading}
          <Text style={{ fontSize: 16, color: palette.fg, fontFamily: palette.weight, letterSpacing: -0.16 }}>
            {children}
          </Text>
        </>
      )}
    </Pressable>
  );
}

export function LinkBtn({ children, onPress }: { children: React.ReactNode; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} style={{ paddingVertical: 8, alignSelf: 'center' }}>
      <Text style={{ fontSize: 14, color: colors.primary, fontFamily: type.bodyLarge.fontFamily }}>{children}</Text>
    </Pressable>
  );
}
