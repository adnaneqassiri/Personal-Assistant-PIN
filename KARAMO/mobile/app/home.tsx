import { useEffect, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { colors } from '@/constants/theme';
import {
  habitsByRange,
  insightToday,
  recentAlerts,
  totalUnreadCount,
  useCases,
} from '@/constants/dashboard-mock';
import type { Period, TabId } from '@/constants/dashboard-mock';
import { dispatchTab } from '@/lib/tab-nav';
import { useAuth } from '@/lib/auth-context';
import { Toast } from '@/components/toast';
import { DashboardHeader } from '@/components/dashboard/header';
import { InsightCard } from '@/components/dashboard/insight-card';
import { PeriodSegmentedControl } from '@/components/dashboard/period-control';
import { ActivitySection } from '@/components/dashboard/activity';
import { UseCaseGrid } from '@/components/dashboard/use-cases';
import { RecentAlertsSection } from '@/components/dashboard/alerts';
import { OfflineBanner } from '@/components/dashboard/offline-banner';
import { TabBar } from '@/components/dashboard/tab-bar';

const LOADING = false;
const EMPTY = false;
const OFFLINE = false;

function timeBasedGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Bonjour';
  if (h < 18) return 'Bon après-midi';
  return 'Bonsoir';
}

function StaggerView({ index, children }: { index: number; children: React.ReactNode }) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(8);

  useEffect(() => {
    const delay = 60 + index * 80;
    opacity.value = withDelay(delay, withTiming(1, { duration: 360, easing: Easing.out(Easing.ease) }));
    translateY.value = withDelay(delay, withTiming(0, { duration: 360, easing: Easing.out(Easing.ease) }));
  }, [index, opacity, translateY]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return <Animated.View style={style}>{children}</Animated.View>;
}

export default function Home() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [period, setPeriod] = useState<Period>('day');
  const [activeTab, setActiveTab] = useState<TabId>('home');
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const data = habitsByRange[period];
  const displayName = user?.givenName ?? user?.name ?? 'Karamo';
  const displayInitial = user?.initials?.charAt(0) ?? 'K';
  const greeting = timeBasedGreeting();

  const showToast = (msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToastMsg(msg);
    toastTimer.current = setTimeout(() => setToastMsg(null), 2400);
  };

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  const handleTabPress = (tab: TabId) => {
    if (tab === 'home') {
      setActiveTab('home');
      return;
    }
    dispatchTab(tab, 'home', showToast);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
      {toastMsg && <Toast kind="warn" message={toastMsg} />}
      <DashboardHeader
        unread={totalUnreadCount}
        onBellPress={() => router.replace('/alerts')}
        name={displayName}
        initial={displayInitial}
        greeting={greeting}
        picture={user?.picture}
      />
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {OFFLINE && <OfflineBanner onRetry={() => showToast('Réessai')} />}
        <StaggerView index={0}>
          <InsightCard
            loading={LOADING}
            empty={EMPTY}
            text={insightToday.text}
            onAskCoach={() => router.replace('/chat')}
          />
        </StaggerView>
        <StaggerView index={1}>
          <PeriodSegmentedControl value={period} onChange={setPeriod} />
        </StaggerView>
        <StaggerView index={2}>
          <ActivitySection data={data} loading={LOADING} period={period} />
        </StaggerView>
        <StaggerView index={3}>
          <UseCaseGrid items={useCases} onItemPress={() => showToast('Bientôt disponible')} />
        </StaggerView>
        <StaggerView index={4}>
          <RecentAlertsSection
            alerts={recentAlerts}
            onSeeAll={() => router.replace('/alerts')}
            onAlertPress={(id) => router.push({ pathname: '/alert/[id]', params: { id } })}
          />
        </StaggerView>
      </ScrollView>
      <TabBar active={activeTab} unread={totalUnreadCount} onTabPress={handleTabPress} />
    </View>
  );
}
