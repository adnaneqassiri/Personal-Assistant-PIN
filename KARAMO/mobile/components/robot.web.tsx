import { Suspense, lazy } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { colors } from '@/constants/theme';

const Spline = lazy(() => import('@splinetool/react-spline'));

export const DEFAULT_ROBOT_SCENE =
  'https://prod.spline.design/PyzDhpQ9E5f1E3MT/scene.splinecode';

type Props = {
  scene?: string;
  style?: object;
};

export function Robot({ scene = DEFAULT_ROBOT_SCENE, style }: Props) {
  return (
    <View
      style={[
        {
          flex: 1,
          width: '100%',
          height: '100%',
          backgroundColor: colors.bg,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Suspense
        fallback={
          <View
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.bg,
            }}
          >
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        }
      >
        {/* Spline returns a canvas. We let it fill its parent. */}
        <Spline scene={scene} style={{ width: '100%', height: '100%' }} />
      </Suspense>
    </View>
  );
}
