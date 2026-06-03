import type { Category } from './dashboard-mock';

export type Day = 'today' | 'yesterday' | string;

export type AlertContext = {
  activity: string;
  audio: string;
  location: string;
  duration: string;
  confidence: string;
};

export type Alert = {
  id: string;
  category: Category;
  title: string;
  body: string;
  time: string;
  day: Day;
  read: boolean;
  actioned: boolean;
  ctx: AlertContext;
};

export const NO_VALUE = '-';

export const ALL_ALERTS: Alert[] = [
  {
    id: 'a_001',
    category: 'health',
    title: 'Hydratation rappel',
    body: "Tu n'as pas bu depuis 2 h. Pense à t'hydrater pour rester focus sur ton bloc de code.",
    time: '14:32',
    day: 'today',
    read: false,
    actioned: false,
    ctx: {
      activity: 'Code (laptop, écran, deux moniteurs)',
      audio: 'Mots-clés : « deadline », « fix bug »',
      location: 'Bureau · 33.5731° N, 7.5898° W',
      duration: '1 h 45 sans interruption',
      confidence: '92%',
    },
  },
  {
    id: 'a_002',
    category: 'productivity',
    title: 'Pause recommandée',
    body: "1 h 45 sans bouger. Lève-toi 5 minutes pour t'aérer.",
    time: '13:15',
    day: 'today',
    read: true,
    actioned: false,
    ctx: {
      activity: 'Position assise prolongée',
      audio: NO_VALUE,
      location: 'Bureau',
      duration: '1 h 45',
      confidence: '88%',
    },
  },
  {
    id: 'a_003',
    category: 'meeting',
    title: 'Synthèse de réunion',
    body: '3 décisions extraites de ta réunion de 11 h. Tap pour voir le résumé.',
    time: '12:08',
    day: 'today',
    read: true,
    actioned: true,
    ctx: {
      activity: 'Réunion (4 personnes détectées)',
      audio: 'Mots-clés : « roadmap », « Q3 », « deadline »',
      location: 'Salle de réunion',
      duration: '52 min',
      confidence: '95%',
    },
  },
  {
    id: 'a_004',
    category: 'rag',
    title: 'Insight matinal',
    body: "Tu codes plus vite après une marche. Pense à sortir 10 min avant ton bloc de l'après-midi.",
    time: '10:42',
    day: 'today',
    read: false,
    actioned: false,
    ctx: {
      activity: 'Pattern hebdomadaire',
      audio: NO_VALUE,
      location: NO_VALUE,
      duration: NO_VALUE,
      confidence: '78%',
    },
  },
  {
    id: 'a_005',
    category: 'health',
    title: 'Posture ajustée',
    body: 'Tu es penché en avant depuis 30 min. Redresse-toi.',
    time: '09:58',
    day: 'today',
    read: true,
    actioned: false,
    ctx: {
      activity: 'Posture assise',
      audio: NO_VALUE,
      location: 'Bureau',
      duration: '32 min',
      confidence: '84%',
    },
  },
  {
    id: 'a_006',
    category: 'productivity',
    title: 'Tâche dépassée',
    body: '« Refactor auth » prend 2× le temps estimé. Veux-tu re-prioriser ?',
    time: '17:21',
    day: 'yesterday',
    read: true,
    actioned: false,
    ctx: {
      activity: 'Code',
      audio: NO_VALUE,
      location: 'Bureau',
      duration: '4 h 12',
      confidence: '90%',
    },
  },
  {
    id: 'a_007',
    category: 'meeting',
    title: 'Réunion sans agenda',
    body: 'Standup 1-1 a duré 38 min sans agenda partagé.',
    time: '15:02',
    day: 'yesterday',
    read: true,
    actioned: true,
    ctx: {
      activity: 'Réunion (2 personnes)',
      audio: NO_VALUE,
      location: NO_VALUE,
      duration: '38 min',
      confidence: '87%',
    },
  },
  {
    id: 'a_008',
    category: 'health',
    title: 'Hydratation rappel',
    body: "Bois un verre d'eau.",
    time: '11:15',
    day: 'yesterday',
    read: true,
    actioned: true,
    ctx: {
      activity: NO_VALUE,
      audio: NO_VALUE,
      location: 'Bureau',
      duration: NO_VALUE,
      confidence: '92%',
    },
  },
  {
    id: 'a_009',
    category: 'rag',
    title: 'Pattern détecté',
    body: 'Tes meilleures sessions de code arrivent entre 9 h et 11 h.',
    time: '18:00',
    day: 'lundi 27 avril',
    read: true,
    actioned: false,
    ctx: {
      activity: 'Pattern hebdomadaire',
      audio: NO_VALUE,
      location: NO_VALUE,
      duration: NO_VALUE,
      confidence: '81%',
    },
  },
  {
    id: 'a_010',
    category: 'productivity',
    title: 'Distraction Slack',
    body: '12 interruptions Slack en 1 h. Mode focus ?',
    time: '14:48',
    day: 'lundi 27 avril',
    read: true,
    actioned: true,
    ctx: {
      activity: NO_VALUE,
      audio: NO_VALUE,
      location: 'Bureau',
      duration: NO_VALUE,
      confidence: '76%',
    },
  },
];

export type HeroIconName = 'Droplet' | 'TimerReset' | 'Users' | 'Sparkles';

export const CAT_HERO_ICON: Record<Category, HeroIconName> = {
  health: 'Droplet',
  productivity: 'TimerReset',
  meeting: 'Users',
  rag: 'Sparkles',
};

export function dayLabel(d: Day): string {
  if (d === 'today') return "Aujourd'hui";
  if (d === 'yesterday') return 'Hier';
  return d;
}
