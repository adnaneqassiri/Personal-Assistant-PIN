import { View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/constants/theme';

type Props = {
  children: React.ReactNode;
  style?: ViewStyle;
  edges?: ('top' | 'bottom')[];
};

export function ScreenFrame({ children, style, edges = ['top', 'bottom'] }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        {
          flex: 1,
          backgroundColor: colors.bg,
          paddingTop: edges.includes('top') ? insets.top : 0,
          paddingBottom: edges.includes('bottom') ? insets.bottom : 0,
          paddingHorizontal: 24,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
