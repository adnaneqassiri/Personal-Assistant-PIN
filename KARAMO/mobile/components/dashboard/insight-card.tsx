import { Pressable, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight, Sparkles } from 'lucide-react-native';
import { colors, fonts } from '@/constants/theme';
import { SkeletonLine } from './skeleton';

type Props = {
  loading?: boolean;
  empty?: boolean;
  text?: string;
  onAskCoach?: () => void;
};

export function InsightCard({ loading = false, empty = false, text, onAskCoach }: Props) {
  return (
    <View
      style={{
        position: 'relative',
        backgroundColor: colors.bgSurface,
        borderWidth: 1,
        borderColor: colors.bgBorder,
        borderRadius: 20,
        padding: 24,
        marginBottom: 16,
        overflow: 'hidden',
      }}
    >
      <LinearGradient
        colors={['rgba(74,83,255,0.08)', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        locations={[0, 0.6]}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        pointerEvents="none"
      />

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <Sparkles
          size={empty ? 28 : 18}
          color={colors.catRag}
          strokeWidth={1.75}
          opacity={empty ? 0.45 : 1}
        />
        <Text
          style={{
            fontSize: 12,
            fontFamily: fonts.sansSemiBold,
            color: colors.catRag,
            letterSpacing: 0.96,
            textTransform: 'uppercase',
            opacity: empty ? 0.6 : 1,
          }}
        >
          Insight du jour
        </Text>
      </View>

      {loading && (
        <View style={{ gap: 8 }}>
          <SkeletonLine width="100%" />
          <SkeletonLine width="92%" />
          <SkeletonLine width="60%" height={12} />
        </View>
      )}

      {!loading && empty && (
        <Text
          style={{
            fontSize: 16,
            fontFamily: fonts.sans,
            color: colors.textSecondary,
            lineHeight: 24,
          }}
        >
          On apprend tes habitudes : reviens dans quelques heures pour ton premier insight.
        </Text>
      )}

      {!loading && !empty && (
        <>
          <Text
            style={{
              fontSize: 17,
              fontFamily: fonts.sans,
              color: colors.text,
              lineHeight: 26,
              marginBottom: 16,
            }}
          >
            {text}
          </Text>
          <Pressable
            onPress={onAskCoach}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start' }}
            hitSlop={8}
          >
            <Text style={{ fontSize: 14, fontFamily: fonts.sansMedium, color: colors.primary }}>
              Demande à mon coach
            </Text>
            <ArrowRight size={14} color={colors.primary} strokeWidth={2} />
          </Pressable>
        </>
      )}
    </View>
  );
}
