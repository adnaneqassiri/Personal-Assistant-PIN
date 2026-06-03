import { router } from 'expo-router';
import type { TabId } from '@/constants/dashboard-mock';

const ROUTES: Record<TabId, string | null> = {
  home: '/home',
  alerts: '/alerts',
  chat: '/chat',
  profile: '/profile',
};

export function dispatchTab(
  target: TabId,
  current: TabId,
  showToast: (msg: string) => void,
) {
  if (target === current) return;
  const route = ROUTES[target];
  if (route) {
    router.replace(route as never);
  } else {
    showToast('Bientôt disponible');
  }
}
