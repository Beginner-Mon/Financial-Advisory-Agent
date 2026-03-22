/**
 * Theme constants — premium dark finance aesthetic.
 */
export const Colors = {
  // Base
  background: '#0a0f1e',
  surface: '#131a2e',
  surfaceLight: '#1a2340',
  card: '#1e2a45',
  cardBorder: '#2a3a5c',

  // Text
  textPrimary: '#f0f4ff',
  textSecondary: '#8892b0',
  textMuted: '#5a6380',

  // Accent
  primary: '#4f8cff',
  primaryDark: '#3a6fd4',
  accent: '#00d4aa',
  accentDark: '#00a88a',

  // Health score colors
  scoreGreen: '#00e68a',
  scoreYellow: '#ffd93d',
  scoreRed: '#ff6b6b',

  // Risk badges
  riskConservative: '#4f8cff',
  riskModerate: '#ffd93d',
  riskAggressive: '#ff6b6b',

  // Product types
  savings: '#00d4aa',
  investment: '#4f8cff',
  loan: '#ffa366',
  insurance: '#c77dff',

  // Status
  error: '#ff4757',
  success: '#00e68a',
  warning: '#ffd93d',

  // Transparent
  overlay: 'rgba(0,0,0,0.5)',
  glass: 'rgba(255,255,255,0.05)',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const FontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 18,
  xl: 22,
  xxl: 28,
  hero: 36,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
};

// Default backend URL - change this for production
export const API_BASE_URL = 'http://10.0.2.2:8000'; // Android emulator → host
export const API_BASE_URL_IOS = 'http://localhost:8000';
export const API_BASE_URL_WEB = 'http://localhost:8000';
