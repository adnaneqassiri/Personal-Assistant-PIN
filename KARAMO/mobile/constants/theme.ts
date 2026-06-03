export const colors = {
  bg: '#000000',
  bgSurface: '#0E0E10',
  bgElevated: '#151518',
  bgBorder: '#27272A',
  text: '#FFFFFF',
  textSecondary: '#B7B7BD',
  textTertiary: '#6E6E76',
  primary: '#4A53FF',
  primaryHover: '#6B73FF',
  primaryPressed: '#2E37D9',
  accent: '#41FF31',
  accentHover: '#5DFF52',
  accentPressed: '#2BCF1E',
  success: '#41FF31',
  warning: '#FFB020',
  error: '#FF3B5C',
  info: '#00C8E6',
  catHealth: '#FF3B5C',
  catProductivity: '#FFB020',
  catMeeting: '#00C8E6',
  catRag: '#9D5CFF',
} as const;

export const space = {
  s1: 4,
  s2: 8,
  s3: 12,
  s4: 16,
  s5: 24,
  s6: 32,
  s7: 48,
  s8: 64,
} as const;

export const radius = {
  sm: 4,
  md: 8,
  lg: 16,
  xl: 24,
  pill: 9999,
} as const;

export const fonts = {
  sans: 'BricolageGrotesque_400Regular',
  sansMedium: 'BricolageGrotesque_500Medium',
  sansSemiBold: 'BricolageGrotesque_600SemiBold',
  sansBold: 'BricolageGrotesque_700Bold',
  mono: 'JetBrainsMono_400Regular',
} as const;

export const type = {
  h1: { fontSize: 28, lineHeight: 34, fontFamily: fonts.sansSemiBold, letterSpacing: -0.4 },
  h2: { fontSize: 22, lineHeight: 29, fontFamily: fonts.sansSemiBold },
  h3: { fontSize: 18, lineHeight: 25, fontFamily: fonts.sansSemiBold },
  bodyLarge: { fontSize: 17, lineHeight: 26, fontFamily: fonts.sans },
  body: { fontSize: 15, lineHeight: 22, fontFamily: fonts.sans },
  bodySmall: { fontSize: 13, lineHeight: 20, fontFamily: fonts.sans },
  label: { fontSize: 12, lineHeight: 17, fontFamily: fonts.sansMedium, letterSpacing: 0.72, textTransform: 'uppercase' as const },
  caption: { fontSize: 11, lineHeight: 15, fontFamily: fonts.sansMedium, letterSpacing: 0.66, textTransform: 'uppercase' as const },
} as const;
