import { Pressable, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, Easing } from 'react-native-reanimated';
import { colors, radius, type } from '@/constants/theme';

type Props = {
  c: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
  on: boolean;
  onToggle: () => void;
};

export function ToggleCard({ c, icon, title, desc, on, onToggle }: Props) {
  const knob = useSharedValue(on ? 20 : 0);
  knob.value = withTiming(on ? 20 : 0, { duration: 200, easing: Easing.bezier(0.4, 0, 0.2, 1) });

  const knobStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: knob.value }],
  }));

  return (
    <Pressable
      onPress={onToggle}
      style={({ pressed }) => ({
        backgroundColor: colors.bgSurface,
        borderWidth: 1,
        borderColor: colors.bgBorder,
        borderLeftWidth: 4,
        borderLeftColor: c,
        borderRadius: radius.lg,
        padding: 18,
        paddingLeft: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        marginBottom: 12,
        transform: [{ scale: pressed ? 0.985 : 1 }],
      })}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          backgroundColor: c + '2E',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {icon}
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ ...type.h3, fontSize: 16, color: colors.text }}>{title}</Text>
        <Text style={{ ...type.bodySmall, color: colors.textSecondary, marginTop: 2 }}>{desc}</Text>
      </View>
      <View
        style={{
          width: 48,
          height: 28,
          borderRadius: radius.pill,
          backgroundColor: on ? colors.primary : '#27272A',
        }}
      >
        <Animated.View
          style={[
            {
              position: 'absolute',
              top: 3,
              left: 3,
              width: 22,
              height: 22,
              borderRadius: 11,
              backgroundColor: '#fff',
              shadowColor: '#000',
              shadowOpacity: 0.25,
              shadowRadius: 4,
              shadowOffset: { width: 0, height: 2 },
            },
            knobStyle,
          ]}
        />
      </View>
    </Pressable>
  );
}
