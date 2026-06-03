export const USER = {
  name: 'Karamo Sylla',
  email: 'karamo.sylla@coach-ai.com',
  initials: 'KS',
};

export const DEVICE = {
  type: 'Raspberry Pi 5 (Edge AI)',
  id: 'rpi5-aghzout-001',
};

export const VERSION = {
  number: '1.0.0',
  build: '1',
};

export type TeamMember = {
  caps: string;
  name: string;
};

export const TEAM: { supervisor: TeamMember; mobileLead: TeamMember } = {
  supervisor: { caps: 'Projet encadré par', name: 'Prof. Dr. Otman Aghzout' },
  mobileLead: { caps: 'Pôle application mobile', name: 'Karamo Sylla' },
};
