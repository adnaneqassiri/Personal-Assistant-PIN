export type Period = 'day' | 'week' | 'month';
export type Category = 'health' | 'productivity' | 'meeting' | 'rag';
export type TabId = 'home' | 'alerts' | 'chat' | 'profile';

export type ActivityCategory = {
  name: string;
  duration: number;
  percentage: number;
  color: string;
};

export type RangeData = {
  totalMin: number;
  categories: ActivityCategory[];
};

export type UseCaseItem = {
  id: string;
  icon: 'Droplet' | 'PersonStanding' | 'Users' | 'TimerReset';
  title: string;
  kpi: string;
  color: string;
};

export type AlertItem = {
  id: string;
  category: Category;
  title: string;
  body: string;
  time: string;
};

export const insightToday = {
  generatedAt: '2026-04-29T15:00:00Z',
  text: 'Tu as passé 3 h 45 en code ce matin et pris 2 pauses. Bien parti pour la journée : pense à boire.',
};

export const habitsByRange: Record<Period, RangeData> = {
  day: {
    totalMin: 432,
    categories: [
      { name: 'Code',    duration: 225, percentage: 52, color: '#4A53FF' },
      { name: 'Réunion', duration: 86,  percentage: 20, color: '#00C8E6' },
      { name: 'Pause',   duration: 65,  percentage: 15, color: '#41FF31' },
      { name: 'Autre',   duration: 56,  percentage: 13, color: '#6E6E76' },
    ],
  },
  week: {
    totalMin: 2340,
    categories: [
      { name: 'Code',    duration: 1260, percentage: 54, color: '#4A53FF' },
      { name: 'Réunion', duration: 540,  percentage: 23, color: '#00C8E6' },
      { name: 'Pause',   duration: 320,  percentage: 14, color: '#41FF31' },
      { name: 'Autre',   duration: 220,  percentage: 9,  color: '#6E6E76' },
    ],
  },
  month: {
    totalMin: 9600,
    categories: [
      { name: 'Code',    duration: 5280, percentage: 55, color: '#4A53FF' },
      { name: 'Réunion', duration: 2160, percentage: 23, color: '#00C8E6' },
      { name: 'Pause',   duration: 1200, percentage: 12, color: '#41FF31' },
      { name: 'Autre',   duration: 960,  percentage: 10, color: '#6E6E76' },
    ],
  },
};

export const useCases: UseCaseItem[] = [
  { id: 'health-hydra',   icon: 'Droplet',        title: 'Hydratation', kpi: '3 alertes',     color: '#FF3B5C' },
  { id: 'health-posture', icon: 'PersonStanding', title: 'Posture',     kpi: '1 alerte',      color: '#FF3B5C' },
  { id: 'meeting',        icon: 'Users',          title: 'Réunion',     kpi: '2 résumés',     color: '#00C8E6' },
  { id: 'tasks',          icon: 'TimerReset',     title: 'Tâches',      kpi: '0 dépassement', color: '#FFB020' },
];

import { ALL_ALERTS } from './alerts-mock';

export const recentAlerts: AlertItem[] = ALL_ALERTS
  .filter(a => a.day === 'today')
  .slice(0, 3)
  .map(a => ({
    id: a.id,
    category: a.category,
    title: a.title,
    body: a.body,
    time: a.time,
  }));

export const totalUnreadCount = ALL_ALERTS.filter(a => !a.read).length;

export const CAT_COLOR: Record<Category, string> = {
  health:       '#FF3B5C',
  productivity: '#FFB020',
  meeting:      '#00C8E6',
  rag:          '#9D5CFF',
};

export const CAT_ICON: Record<Category, 'Droplet' | 'Timer' | 'Users' | 'Sparkles'> = {
  health:       'Droplet',
  productivity: 'Timer',
  meeting:      'Users',
  rag:          'Sparkles',
};

export const CAT_LABEL: Record<Category, string> = {
  health:       'SANTÉ',
  productivity: 'PRODUCTIVITÉ',
  meeting:      'RÉUNION',
  rag:          'RAG',
};

export const ACTIVITY_CAPS: Record<Period, string> = {
  day:   'Activité du jour',
  week:  'Activité de la semaine',
  month: 'Activité du mois',
};

export function fmtDuration(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} h`;
  return `${h} h ${String(m).padStart(2, '0')}`;
}
