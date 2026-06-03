import { useEffect, useMemo, useRef, useState } from 'react';
import {
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { BellOff, Clock, MapPin, X } from 'lucide-react-native';
import Animated, {
  useSharedValue,
} from 'react-native-reanimated';
import { colors, fonts } from '@/constants/theme';
import { ALL_ALERTS, dayLabel, NO_VALUE } from '@/constants/alerts-mock';
import { CAT_COLOR, CAT_LABEL } from '@/constants/dashboard-mock';
import { SkeletonCircle, SkeletonLine } from '@/components/dashboard/skeleton';
import { SectionHeader } from '@/components/dashboard/section-header';
import { HeaderBar } from '@/components/alert-detail/header-bar';
import { HeroIcon } from '@/components/alert-detail/hero-icon';
import { ContextCard } from '@/components/alert-detail/context-card';
import { ActionStack } from '@/components/alert-detail/action-stack';

const LOADING_TEST = false;
const NOT_FOUND_TEST = false;

export default function AlertDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const scrollY = useSharedValue(0);

  const alert = useMemo(() => ALL_ALERTS.find(a => a.id === id), [id]);
  const [actioned, setActioned] = useState(alert?.actioned ?? false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  if (LOADING_TEST) return <DetailLoading insetsTop={insets.top} />;
  if (NOT_FOUND_TEST || !alert) return <DetailNotFound onBack={() => router.back()} />;

  const color = CAT_COLOR[alert.category];

  const handleAction = () => {
    if (actioned) {
      setActioned(false);
      return;
    }
    setActioned(true);
    setShowSuccessToast(true);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setShowSuccessToast(false), 2200);
  };

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollY.value = e.nativeEvent.contentOffset.y;
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, paddingTop: insets.top, zIndex: 10 }}>
        <HeaderBar
          scrollY={scrollY}
          actioned={actioned}
          onClose={() => router.back()}
        />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingBottom: 24 + insets.bottom }}
      >
        <View
          style={{
            paddingTop: 76 + insets.top,
            paddingHorizontal: 24,
            alignItems: 'center',
          }}
        >
          <HeroIcon category={alert.category} />
          <Text
            style={{
              fontSize: 12,
              fontFamily: fonts.sansSemiBold,
              color,
              letterSpacing: 0.96,
              textTransform: 'uppercase',
              marginBottom: 8,
            }}
          >
            {CAT_LABEL[alert.category]}
          </Text>
          <Text
            style={{
              fontSize: 28,
              fontFamily: fonts.sansBold,
              color: colors.text,
              letterSpacing: -0.56,
              lineHeight: 34,
              textAlign: 'center',
              marginBottom: 12,
            }}
          >
            {alert.title}
          </Text>
          <View style={{ alignItems: 'center', gap: 4 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Clock size={14} color={colors.textSecondary} strokeWidth={1.75} />
              <Text
                style={{
                  fontSize: 13,
                  fontFamily: fonts.mono,
                  color: colors.textSecondary,
                  fontVariant: ['tabular-nums'],
                }}
              >
                {dayLabel(alert.day)} · {alert.time}
              </Text>
            </View>
            {alert.ctx.location !== NO_VALUE && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <MapPin size={14} color={colors.textSecondary} strokeWidth={1.75} />
                <Text
                  style={{
                    fontSize: 13,
                    fontFamily: fonts.sans,
                    color: colors.textSecondary,
                  }}
                >
                  {alert.ctx.location.split(' · ')[0]}
                </Text>
              </View>
            )}
          </View>
        </View>

        <Text
          style={{
            marginTop: 40,
            marginHorizontal: 24,
            fontSize: 17,
            fontFamily: fonts.sans,
            color: colors.text,
            lineHeight: 26,
          }}
        >
          {alert.body}
        </Text>

        <View style={{ marginTop: 32, marginHorizontal: 24 }}>
          <SectionHeader caps="Contexte au moment de l'alerte" />
          <ContextCard ctx={alert.ctx} />
        </View>

        <ActionStack
          actioned={actioned}
          showSuccessToast={showSuccessToast}
          onMarkActioned={handleAction}
          onAskCoach={() => router.push('/chat')}
          insetsBottom={insets.bottom}
        />
      </ScrollView>
    </View>
  );
}

function DetailLoading({ insetsTop }: { insetsTop: number }) {
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insetsTop }}>
      <View style={{ paddingTop: 76, alignItems: 'center', gap: 16, paddingHorizontal: 24 }}>
        <SkeletonCircle size={200} />
        <SkeletonLine width={240} height={22} />
        <SkeletonLine width={200} height={14} />
      </View>
      <View style={{ marginTop: 32, marginHorizontal: 24, gap: 12 }}>
        {[0, 1, 2, 3].map(i => (
          <SkeletonLine key={i} height={16} />
        ))}
      </View>
    </View>
  );
}

function DetailNotFound({ onBack }: { onBack: () => void }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
      <View
        style={{
          height: 56,
          paddingHorizontal: 16,
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <Pressable
          onPress={onBack}
          accessibilityLabel="Fermer"
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: 'rgba(14,14,16,0.85)',
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.08)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <X size={20} color={colors.text} strokeWidth={1.75} />
        </Pressable>
      </View>
      <Animated.View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          paddingHorizontal: 32,
        }}
      >
        <BellOff size={48} color={colors.textTertiary} strokeWidth={1.5} />
        <Text
          style={{
            fontSize: 17,
            fontFamily: fonts.sansSemiBold,
            color: colors.text,
            letterSpacing: -0.17,
            textAlign: 'center',
            marginTop: 4,
          }}
        >
          {"Cette alerte n'existe plus"}
        </Text>
        <Text
          style={{
            fontSize: 14,
            fontFamily: fonts.sans,
            color: colors.textSecondary,
            textAlign: 'center',
            maxWidth: 260,
            lineHeight: 21,
          }}
        >
          Elle a été supprimée ou a expiré.
        </Text>
        <Pressable
          onPress={onBack}
          hitSlop={8}
          style={{ marginTop: 8, paddingVertical: 8, paddingHorizontal: 12 }}
        >
          <Text
            style={{
              fontSize: 14,
              fontFamily: fonts.sansMedium,
              color: colors.primary,
            }}
          >
            Retour
          </Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}
