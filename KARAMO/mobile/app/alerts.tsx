import { useEffect, useMemo, useRef, useState } from 'react';
import {
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type SectionListData,
  SectionList,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors, fonts } from '@/constants/theme';
import { ALL_ALERTS, dayLabel } from '@/constants/alerts-mock';
import type { Alert } from '@/constants/alerts-mock';
import type { TabId } from '@/constants/dashboard-mock';
import { dispatchTab } from '@/lib/tab-nav';
import { Toast } from '@/components/toast';
import { TabBar } from '@/components/dashboard/tab-bar';
import { ListHeader } from '@/components/alerts/list-header';
import { SearchBar } from '@/components/alerts/search-bar';
import { CategoryChips, type ChipFilter } from '@/components/alerts/category-chips';
import { AlertRow } from '@/components/alerts/alert-row';
import { AlertEmpty, type EmptyVariant } from '@/components/alerts/alert-empty';
import { AlertSkeleton } from '@/components/alerts/alert-skeleton';

const LOADING_TEST = false;

type Section = {
  title: string;
  data: Alert[];
};

export default function Alerts() {
  const insets = useSafeAreaInsets();

  const [category, setCategory] = useState<ChipFilter>('all');
  const [search, setSearch] = useState('');
  const [scrollY, setScrollY] = useState(0);
  const [readIds, setReadIds] = useState<Set<string>>(
    () => new Set(ALL_ALERTS.filter(a => a.read).map(a => a.id)),
  );
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const filtered: Alert[] = useMemo(() => {
    if (LOADING_TEST) return [];
    let list: Alert[] = ALL_ALERTS;
    if (category !== 'all') list = list.filter(a => a.category === category);
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        a => a.title.toLowerCase().includes(q) || a.body.toLowerCase().includes(q),
      );
    }
    return list;
  }, [category, search]);

  const sections: Section[] = useMemo(() => {
    const out: Section[] = [];
    const seen = new Set<string>();
    for (const a of filtered) {
      if (!seen.has(a.day)) {
        seen.add(a.day);
        out.push({ title: a.day, data: [] });
      }
      out[out.length - 1].data.push(a);
    }
    return out;
  }, [filtered]);

  const collapsed = scrollY > 80;
  const unreadCount = ALL_ALERTS.filter(a => !readIds.has(a.id)).length;

  const emptyVariant: EmptyVariant | null = (() => {
    if (LOADING_TEST || filtered.length > 0) return null;
    if (search.trim()) return 'search';
    if (category !== 'all') return 'filter';
    return 'first-day';
  })();

  const markAllRead = () => {
    setReadIds(new Set(ALL_ALERTS.map(a => a.id)));
  };

  const resetFilters = () => {
    setCategory('all');
    setSearch('');
  };

  const handleTabPress = (tab: TabId) => dispatchTab(tab, 'alerts', showToast);

  const handleAlertPress = (alert: Alert) => {
    setReadIds(prev => {
      const next = new Set(prev);
      next.add(alert.id);
      return next;
    });
    router.push({ pathname: '/alert/[id]', params: { id: alert.id } });
  };

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setScrollY(e.nativeEvent.contentOffset.y);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
      {toastMsg && <Toast kind="warn" message={toastMsg} />}
      <ListHeader unreadCount={unreadCount} onMarkAll={markAllRead} />
      <SearchBar value={search} onChange={setSearch} collapsed={collapsed} />
      <CategoryChips active={category} onChange={setCategory} />

      {LOADING_TEST ? (
        <View style={{ flex: 1, paddingTop: 16 }}>
          <DayHeader title="Aujourd'hui" />
          <AlertSkeleton />
          <AlertSkeleton />
          <AlertSkeleton />
          <DayHeader title="Hier" />
          <AlertSkeleton />
          <AlertSkeleton />
        </View>
      ) : emptyVariant ? (
        <AlertEmpty
          variant={emptyVariant}
          query={search}
          onResetFilters={resetFilters}
        />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={a => a.id}
          stickySectionHeadersEnabled
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 16 }}
          onScroll={onScroll}
          scrollEventThrottle={16}
          renderSectionHeader={({ section }: { section: SectionListData<Alert, Section> }) => (
            <DayHeader title={dayLabel(section.title)} />
          )}
          renderItem={({ item }) => (
            <AlertRow
              alert={item}
              unread={!readIds.has(item.id)}
              onPress={() => handleAlertPress(item)}
            />
          )}
          ListFooterComponent={
            <Text
              style={{
                textAlign: 'center',
                paddingVertical: 16,
                paddingHorizontal: 24,
                fontSize: 13,
                fontFamily: fonts.sans,
                color: colors.textTertiary,
              }}
            >
              {"C'est tout pour le moment"}
            </Text>
          }
        />
      )}

      <TabBar active="alerts" unread={unreadCount} onTabPress={handleTabPress} />
    </View>
  );
}

function DayHeader({ title }: { title: string }) {
  return (
    <View style={{ backgroundColor: colors.bg, paddingTop: 16, paddingBottom: 8, paddingHorizontal: 24 }}>
      <Text
        style={{
          fontSize: 12,
          fontFamily: fonts.sansSemiBold,
          color: colors.textTertiary,
          letterSpacing: 0.96,
          textTransform: 'uppercase',
        }}
      >
        {title}
      </Text>
    </View>
  );
}
