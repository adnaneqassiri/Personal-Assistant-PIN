import { useEffect, useMemo } from 'react';
import { Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
  type SharedValue,
} from 'react-native-reanimated';
import { colors, fonts } from '@/constants/theme';
import { ACTIVITY_CAPS, fmtDuration } from '@/constants/dashboard-mock';
import type { ActivityCategory, Period, RangeData } from '@/constants/dashboard-mock';
import { SectionHeader } from './section-header';
import { SkeletonCircle, SkeletonLine } from './skeleton';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const SIZE = 200;
const STROKE = 16;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

type SegmentProps = {
  percentage: number;
  offsetPercentage: number;
  color: string;
  progress: SharedValue<number>;
};

function RingSegment({ percentage, offsetPercentage, color, progress }: SegmentProps) {
  const animatedProps = useAnimatedProps(() => {
    const len = (percentage / 100) * CIRCUMFERENCE * progress.value;
    const gap = CIRCUMFERENCE - len;
    return {
      strokeDasharray: [len, gap] as unknown as readonly number[],
    };
  });

  return (
    <AnimatedCircle
      cx={SIZE / 2}
      cy={SIZE / 2}
      r={RADIUS}
      fill="none"
      stroke={color}
      strokeWidth={STROKE}
      strokeLinecap="butt"
      strokeDashoffset={-((offsetPercentage / 100) * CIRCUMFERENCE)}
      animatedProps={animatedProps}
    />
  );
}

type RingProps = {
  categories: ActivityCategory[];
  totalMin: number;
  animationKey?: string | number;
};

export function ActivityRing({ categories, totalMin, animationKey }: RingProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = 0;
    progress.value = withTiming(1, {
      duration: 800,
      easing: Easing.bezier(0.215, 0.61, 0.355, 1),
    });
  }, [animationKey, progress]);

  const segments = useMemo(() => {
    let acc = 0;
    return categories.map(c => {
      const offset = acc;
      acc += c.percentage;
      return { ...c, offset };
    });
  }, [categories]);

  return (
    <View
      style={{
        width: SIZE,
        height: SIZE,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <View
        style={{
          position: 'absolute',
          width: SIZE,
          height: SIZE,
          transform: [{ rotate: '-90deg' }],
        }}
      >
        <Svg width={SIZE} height={SIZE}>
          <Circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke={colors.bgBorder}
            strokeWidth={STROKE}
          />
          {segments.map((s, i) => (
            <RingSegment
              key={i}
              percentage={s.percentage}
              offsetPercentage={s.offset}
              color={s.color}
              progress={progress}
            />
          ))}
        </Svg>
      </View>
      <View style={{ alignItems: 'center' }}>
        <Text
          style={{
            fontSize: 40,
            fontFamily: fonts.sansBold,
            color: colors.text,
            letterSpacing: -0.8,
            fontVariant: ['tabular-nums'],
            lineHeight: 44,
            marginBottom: 6,
          }}
        >
          {fmtDuration(totalMin)}
        </Text>
        <Text
          style={{
            fontSize: 10,
            fontFamily: fonts.sansMedium,
            color: colors.textSecondary,
            letterSpacing: 1,
            textTransform: 'uppercase',
          }}
        >
          Total actif
        </Text>
      </View>
    </View>
  );
}

type LegendProps = {
  categories: ActivityCategory[];
};

export function ActivityLegend({ categories }: LegendProps) {
  return (
    <View style={{ flex: 1, gap: 12 }}>
      {categories.map((c, i) => (
        <View key={i} style={{ flexDirection: 'column' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View
              style={{
                width: 10,
                height: 10,
                borderRadius: 5,
                backgroundColor: c.color,
              }}
            />
            <Text
              numberOfLines={1}
              style={{
                flex: 1,
                fontSize: 13,
                fontFamily: fonts.sansMedium,
                color: colors.text,
              }}
            >
              {c.name}
            </Text>
            <Text
              style={{
                fontSize: 13,
                fontFamily: fonts.sansSemiBold,
                color: colors.text,
                fontVariant: ['tabular-nums'],
              }}
            >
              {fmtDuration(c.duration)}
            </Text>
          </View>
          <Text
            style={{
              marginLeft: 18,
              fontSize: 11,
              fontFamily: fonts.sansMedium,
              color: colors.textTertiary,
              fontVariant: ['tabular-nums'],
              marginTop: 2,
            }}
          >
            {c.percentage}%
          </Text>
        </View>
      ))}
    </View>
  );
}

type SectionProps = {
  data: RangeData;
  loading?: boolean;
  period: Period;
};

export function ActivitySection({ data, loading = false, period }: SectionProps) {
  return (
    <View style={{ marginBottom: 32 }}>
      <SectionHeader caps={ACTIVITY_CAPS[period]} />
      {loading ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <SkeletonCircle size={SIZE} />
          <View style={{ flex: 1, gap: 12 }}>
            {[0, 1, 2, 3].map(i => (
              <SkeletonLine key={i} height={14} width="85%" />
            ))}
          </View>
        </View>
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <ActivityRing categories={data.categories} totalMin={data.totalMin} animationKey={period} />
          <ActivityLegend categories={data.categories} />
        </View>
      )}
    </View>
  );
}
