import { ActivityIndicator, View } from 'react-native';
import { colors } from '@/constants/theme';
import { CoachLogo } from '@/components/coach-logo';

export const DEFAULT_ROBOT_SCENE =
  'https://prod.spline.design/PyzDhpQ9E5f1E3MT/scene.splinecode';

type Props = {
  scene?: string;
  style?: object;
};

export function Robot({ style }: Props) {
  // Native fallback: Spline cannot render in React Native (no WebGL DOM).
  // Show the brand logo on top of a loading state so the app still feels alive.
  return (
    <View
      style={[
        {
          flex: 1,
          width: '100%',
          height: '100%',
          backgroundColor: colors.bg,
          alignItems: 'center',
          justifyContent: 'center',
          gap: 24,
        },
        style,
      ]}
    >
      <CoachLogo size={96} />
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}
