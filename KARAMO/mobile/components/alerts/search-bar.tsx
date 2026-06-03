import { useEffect, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { Search, X } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { colors, fonts } from '@/constants/theme';

type Props = {
  value: string;
  onChange: (next: string) => void;
  collapsed: boolean;
};

const EXPANDED_HEIGHT = 60;

export function SearchBar({ value, onChange, collapsed }: Props) {
  const [focused, setFocused] = useState(false);

  const height = useSharedValue(EXPANDED_HEIGHT);

  useEffect(() => {
    height.value = withTiming(collapsed ? 0 : EXPANDED_HEIGHT, {
      duration: 200,
      easing: Easing.out(Easing.ease),
    });
  }, [collapsed, height]);

  const wrapStyle = useAnimatedStyle(() => ({
    height: height.value,
  }));

  return (
    <Animated.View
      style={[
        {
          paddingHorizontal: 24,
          backgroundColor: colors.bg,
          overflow: 'hidden',
        },
        wrapStyle,
      ]}
    >
      <View style={{ paddingTop: 12 }}>
        <View
          style={{
            height: 48,
            backgroundColor: colors.bgSurface,
            borderWidth: focused ? 1.5 : 1,
            borderColor: focused ? colors.primary : colors.bgBorder,
            borderRadius: 12,
            paddingHorizontal: focused ? 15.5 : 16,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <Search size={20} color={colors.textTertiary} strokeWidth={1.75} />
          <TextInput
            value={value}
            onChangeText={onChange}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Rechercher dans tes alertes"
            placeholderTextColor={colors.textTertiary}
            style={{
              flex: 1,
              color: colors.text,
              fontFamily: fonts.sans,
              fontSize: 15,
              padding: 0,
            }}
          />
          {value.length > 0 && (
            <Pressable
              onPress={() => onChange('')}
              hitSlop={8}
              accessibilityLabel="Effacer la recherche"
              style={{ padding: 4 }}
            >
              <X size={16} color={colors.textTertiary} strokeWidth={2} />
            </Pressable>
          )}
        </View>
      </View>
    </Animated.View>
  );
}
