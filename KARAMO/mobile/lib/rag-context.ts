import {
  habitsByRange,
  insightToday,
  recentAlerts,
  useCases,
  fmtDuration,
} from '@/constants/dashboard-mock';
import { ALL_ALERTS } from '@/constants/alerts-mock';

export type CoachContext = {
  userName?: string;
  todayDate: string;
};

function formatRange(label: string, data: { totalMin: number; categories: { name: string; duration: number; percentage: number }[] }): string {
  const lines = data.categories
    .map((c) => `  - ${c.name}: ${fmtDuration(c.duration)} (${c.percentage}%)`)
    .join('\n');
  return `${label} (total ${fmtDuration(data.totalMin)}):\n${lines}`;
}

function formatAlerts(): string {
  const today = ALL_ALERTS.filter((a) => a.day === 'today');
  const yesterday = ALL_ALERTS.filter((a) => a.day === 'yesterday');
  const todayLines = today.length
    ? today
        .map((a) => `  - [${a.category}] ${a.time} - ${a.title}: ${a.body}`)
        .join('\n')
    : '  (aucune alerte aujourd\'hui)';
  const yesterdayLines = yesterday.length
    ? yesterday
        .map((a) => `  - [${a.category}] ${a.time} - ${a.title}: ${a.body}`)
        .join('\n')
    : '  (aucune alerte hier)';
  return `Alertes d'aujourd'hui:\n${todayLines}\n\nAlertes d'hier:\n${yesterdayLines}`;
}

function formatUseCases(): string {
  return useCases
    .map((u) => `  - ${u.title}: ${u.kpi}`)
    .join('\n');
}

export function buildSystemPrompt(ctx: CoachContext): string {
  const greeting = ctx.userName ? ` L'utilisateur s'appelle ${ctx.userName}.` : '';
  return `Tu es Coach AI, un assistant personnel qui analyse les donnees d'activite captees par un boitier IoT installe sur le bureau de l'utilisateur (vision, audio, localisation).${greeting} Tu reponds en francais, de maniere concise (2-4 phrases max), factuelle et bienveillante, en t'appuyant UNIQUEMENT sur les donnees fournies ci-dessous. Si une information n'est pas presente, dis-le honnetement plutot que d'inventer. N'utilise pas de tirets cadratins (-) dans tes reponses. Utilise des donnees chiffrees quand elles sont disponibles.

Date du jour: ${ctx.todayDate}

INSIGHT DU JOUR (genere par le LLM le matin):
${insightToday.text}

ACTIVITE DE L'UTILISATEUR:
${formatRange("Aujourd'hui", habitsByRange.day)}

${formatRange('Cette semaine', habitsByRange.week)}

${formatRange('Ce mois', habitsByRange.month)}

ALERTES RECENTES (5 dernieres aujourd'hui sont prioritaires):
${formatAlerts()}

RESUME PAR CAS D'USAGE (compteur du jour):
${formatUseCases()}

Reponds toujours en francais, de maniere concise. Si on te demande une analyse comparative entre periodes, utilise les donnees ci-dessus.`;
}

export function buildSuggestionsContext(): string[] {
  return [
    "Résume-moi ma journée d'aujourd'hui",
    'Combien de temps en réunion cette semaine ?',
    'Quelles habitudes je dois améliorer ?',
    'Compare ma semaine à mon mois',
  ];
}
