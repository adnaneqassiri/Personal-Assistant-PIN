import { useEffect, useState } from 'react';
import { LayoutChangeEvent, Pressable, Text, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { colors, fonts } from '@/constants/theme';
import type { Period } from '@/constants/dashboard-mock';

type Props = {
  value: Period;
  onChange: (next: Period) => void;
};

const OPTIONS: { id: Period; label: string }[] = [
  { id: 'day',   label: 'Jour' },
  { id: 'week',  label: 'Semaine' },
  { id: 'month', label: 'Mois' },
];

export function PeriodSegmentedControl({ value, onChange }: Props) {
  const [containerWidth, setContainerWidth] = useState(0);
  const segWidth = containerWidth > 0 ? (containerWidth - 8) / 3 : 0;

  const idx = OPTIONS.findIndex(o => o.id === value);
  const translateX = useSharedValue(0);

  useEffect(() => {
    translateX.value = withTiming(idx * segWidth, {
      duration: 200,
      easing: Easing.out(Easing.ease),
    });
  }, [idx, segWidth, translateX]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const onLayout = (e: LayoutChangeEvent) => {
    setContainerWidth(e.nativeEvent.layout.width);
  };

  return (
    <View
      onLayout={onLayout}
      style={{
        position: 'relative',
        backgroundColor: colors.bgSurface,
        borderWidth: 1,
        borderColor: colors.bgBorder,
        borderRadius: 12,
        padding: 4,
        height: 44,
        flexDirection: 'row',
        marginBottom: 24,
      }}
    >
      {segWidth > 0 && (
        <Animated.View
          style={[
            {
              position: 'absolute',
              top: 4,
              left: 4,
              bottom: 4,
              width: segWidth,
              backgroundColor: colors.primary,
              borderRadius: 8,
            },
            indicatorStyle,
          ]}
        />
      )}
      {OPTIONS.map(o => {
        const active = o.id === value;
        return (
          <Pressable
            key={o.id}
            onPress={() => onChange(o.id)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 8,
            }}
          >
            <Text
              style={{
                fontSize: 14,
                fontFamily: active ? fonts.sansSemiBold : fonts.sansMedium,
                color: active ? '#FFFFFF' : colors.textSecondary,
              }}
            >
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
