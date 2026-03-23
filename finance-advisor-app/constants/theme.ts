/**
 * Theme constants — premium dark finance aesthetic.
 * Step 7.2 — Design Tokens & Theme
 */

// ---------------------------------------------------------------------------
// Colors
// ---------------------------------------------------------------------------
export const Colors = {
  // Base
  background: '#0a0f1e',
  surface: '#131a2e',
  surfaceLight: '#1a2340',
  card: '#1e2a45',
  cardBorder: '#2a3a5c',

  // Bank branding
  navy: '#0A1628',
  gold: '#C9A84C',
  goldLight: '#E0C97A',
  goldDark: '#9C7E2A',
  white: '#FFFFFF',

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

  // Amount colors
  amountPositive: '#00e68a',
  amountNegative: '#ff6b6b',

  // Transparent
  overlay: 'rgba(0,0,0,0.5)',
  glass: 'rgba(255,255,255,0.05)',
  glassLight: 'rgba(255,255,255,0.08)',
  glassMedium: 'rgba(255,255,255,0.12)',
};

// ---------------------------------------------------------------------------
// Spacing scale
// ---------------------------------------------------------------------------
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
};

// ---------------------------------------------------------------------------
// Typography
// ---------------------------------------------------------------------------
export const FontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 18,
  xl: 24,
  xxl: 32,
  hero: 42,
};

export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};

// ---------------------------------------------------------------------------
// Border Radius
// ---------------------------------------------------------------------------
export const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 16,
  xl: 24,
  full: 9999,
};

// ---------------------------------------------------------------------------
// Shadows
// ---------------------------------------------------------------------------
export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  gold: {
    shadowColor: '#C9A84C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
};

// ---------------------------------------------------------------------------
// API URLs
// ---------------------------------------------------------------------------
export const API_BASE_URL = 'http://10.0.2.2:8000'; // Android emulator → host
export const API_BASE_URL_IOS = 'http://localhost:8000';
export const API_BASE_URL_WEB = 'http://localhost:8000';
