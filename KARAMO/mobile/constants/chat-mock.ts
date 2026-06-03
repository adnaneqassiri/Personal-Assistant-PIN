export type Group = 'today' | 'week' | 'older';
export type ConvId = string;

export type Conversation = {
  id: ConvId;
  title: string;
  preview: string;
  time: string;
  group: Group;
  count: number;
  createdAt?: number;
};

export type Message = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  time: string;
  sources?: number;
  streaming?: boolean;
};

export const CONVERSATIONS: Conversation[] = [];

export const MESSAGES_BY_CONV: Record<ConvId, Message[]> = {};

export const SUGGESTIONS: string[] = [
  "Résume-moi ma journée d'aujourd'hui",
  'Combien de temps en réunion cette semaine ?',
  'Quelles habitudes je dois améliorer ?',
  'Compare ma semaine à mon mois',
];

export const GROUP_LABEL: Record<Group, string> = {
  today: "Aujourd'hui",
  week: 'Cette semaine',
  older: 'Plus ancien',
};
