import { Pressable, Text, View } from 'react-native';
import { Check, MoreVertical, X } from 'lucide-react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';
import { colors, fonts } from '@/constants/theme';

type Props = {
  scrollY: SharedValue<number>;
  actioned: boolean;
  onClose?: () => void;
  onMore?: () => void;
};

export function HeaderBar({ scrollY, actioned, onClose, onMore }: Props) {
  const bgStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, 60], [0, 1], 'clamp'),
  }));

  return (
    <View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 56,
        zIndex: 10,
      }}
    >
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(14,14,16,0.85)',
            borderBottomWidth: 1,
            borderBottomColor: colors.bgBorder,
          },
          bgStyle,
        ]}
      />
      <View
        style={{
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          paddingVertical: 8,
        }}
      >
        <IconButton onPress={onClose} accessibilityLabel="Fermer">
          <X size={20} color={colors.text} strokeWidth={1.75} />
        </IconButton>
        {actioned && (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              paddingVertical: 6,
              paddingHorizontal: 12,
              backgroundColor: 'rgba(65,255,49,0.12)',
              borderRadius: 9999,
            }}
          >
            <Check size={12} color={colors.accent} strokeWidth={2.5} />
            <Text
              style={{
                fontSize: 11,
                fontFamily: fonts.sansSemiBold,
                color: colors.accent,
                letterSpacing: 0.66,
                textTransform: 'uppercase',
              }}
            >
              Actionnée
            </Text>
          </View>
        )}
        <IconButton onPress={onMore} accessibilityLabel="Plus d'actions">
          <MoreVertical size={20} color={colors.text} strokeWidth={1.75} />
        </IconButton>
      </View>
    </View>
  );
}

function IconButton({
  children,
  onPress,
  accessibilityLabel,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  accessibilityLabel?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => ({
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: pressed ? 'rgba(20,20,24,0.95)' : 'rgba(14,14,16,0.85)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        alignItems: 'center',
        justifyContent: 'center',
      })}
    >
      {children}
    </Pressable>
  );
}
