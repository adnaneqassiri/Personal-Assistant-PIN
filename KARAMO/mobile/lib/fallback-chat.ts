import { habitsByRange, fmtDuration } from '@/constants/dashboard-mock';
import { ALL_ALERTS } from '@/constants/alerts-mock';

type Rule = { keywords: string[]; respond: () => string };

const day = habitsByRange.day;
const week = habitsByRange.week;
const month = habitsByRange.month;

const code = day.categories.find((c) => c.name === 'Code');
const meeting = day.categories.find((c) => c.name === 'Réunion');
const pause = day.categories.find((c) => c.name === 'Pause');

const todayAlerts = ALL_ALERTS.filter((a) => a.day === 'today');
const unread = ALL_ALERTS.filter((a) => !a.read).length;
const hydration = todayAlerts.filter((a) => a.title.toLowerCase().includes('hydra')).length;

const RULES: Rule[] = [
  {
    keywords: ['résume', 'resume', 'journée', 'journee', "aujourd'hui", 'aujourdhui'],
    respond: () =>
      `Aujourd'hui, tu as passé ${code ? fmtDuration(code.duration) : ''} en code et ${meeting ? fmtDuration(meeting.duration) : ''} en réunion, avec ${pause ? fmtDuration(pause.duration) : ''} de pause. Tu as ${unread} alerte${unread > 1 ? 's' : ''} non lue${unread > 1 ? 's' : ''}.`,
  },
  {
    keywords: ['code', 'coder', 'programmation', 'programme'],
    respond: () => {
      const w = week.categories.find((c) => c.name === 'Code');
      return `En code, tu es à ${code ? fmtDuration(code.duration) : '-'} aujourd'hui et ${w ? fmtDuration(w.duration) : '-'} cette semaine (${w?.percentage ?? 0}% de ton temps). C'est ton activité principale.`;
    },
  },
  {
    keywords: ['réunion', 'reunion', 'meeting', 'meet'],
    respond: () => {
      const w = week.categories.find((c) => c.name === 'Réunion');
      return `Cette semaine, tu as passé ${w ? fmtDuration(w.duration) : '-'} en réunion (${w?.percentage ?? 0}% de ton temps). Aujourd'hui, ${meeting ? fmtDuration(meeting.duration) : '0 min'}.`;
    },
  },
  {
    keywords: ['pause', 'repos', 'break'],
    respond: () => {
      const w = week.categories.find((c) => c.name === 'Pause');
      return `Tu as pris ${pause ? fmtDuration(pause.duration) : '0 min'} de pause aujourd'hui. Sur la semaine, tu es à ${w ? fmtDuration(w.duration) : '0 min'} (${w?.percentage ?? 0}%). C'est dans la moyenne.`;
    },
  },
  {
    keywords: ['hydra', 'boire', 'eau', 'soif'],
    respond: () =>
      `Tu as reçu ${hydration} rappel${hydration > 1 ? 's' : ''} d'hydratation aujourd'hui. Pense à boire régulièrement, surtout entre deux blocs de code.`,
  },
  {
    keywords: ['alerte', 'notif', 'notification'],
    respond: () =>
      `Tu as ${unread} alerte${unread > 1 ? 's' : ''} non lue${unread > 1 ? 's' : ''} sur ${todayAlerts.length} reçues aujourd'hui. Catégories principales : santé, productivité, réunion.`,
  },
  {
    keywords: ['habitude', 'améliorer', 'ameliorer', 'changer'],
    respond: () =>
      `Trois points cette semaine : (1) hydratation en baisse (rappels fréquents), (2) tu enchaînes plus de 90 min sans pause sur la majorité de tes blocs de code, (3) tes pics de concentration sont entre 9 h et 11 h, essaie de protéger ce créneau.`,
  },
  {
    keywords: ['mois', 'comparer', 'compare', 'semaine'],
    respond: () => {
      const wCode = week.categories.find((c) => c.name === 'Code');
      const mCode = month.categories.find((c) => c.name === 'Code');
      return `Sur la semaine, ton temps de code est ${wCode ? fmtDuration(wCode.duration) : '-'} (${wCode?.percentage ?? 0}%). Sur le mois, ${mCode ? fmtDuration(mCode.duration) : '-'} (${mCode?.percentage ?? 0}%). Ton rythme reste stable.`;
    },
  },
];

const DEFAULT_RESPONSE =
  "Je peux te répondre sur ton activité (code, réunions, pauses), tes alertes santé et tes habitudes. Pose-moi une question là-dessus, par exemple : \"Résume-moi ma journée\" ou \"Combien de temps en réunion cette semaine ?\".";

export function fallbackAnswer(question: string): string {
  const q = question.toLowerCase();
  for (const rule of RULES) {
    if (rule.keywords.some((k) => q.includes(k))) {
      return rule.respond();
    }
  }
  return DEFAULT_RESPONSE;
}
