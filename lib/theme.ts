export const theme = {
  colors: {
    plum: '#6B4C6E',
    plumDark: '#3D2A3F',
    blush: '#D4908E',
    background: '#FAF5F5',
    white: '#FFFFFF',
    gray100: '#F5F0F5',
    gray300: '#D1C9D3',
    gray500: '#8A7F8C',
    gray700: '#5A5160',
    error: '#DC3545',
    success: '#2D8A4E',
    warning: '#E6A817',
  },

  spacing: {
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    5: 20,
    6: 24,
    8: 32,
    10: 40,
    12: 48,
  },

  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },

  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 22,
    xxl: 28,
    display: 34,
  },

  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
} as const;

export type Theme = typeof theme;
