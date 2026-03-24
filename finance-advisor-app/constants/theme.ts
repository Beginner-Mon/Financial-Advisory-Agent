/**
 * Theme constants — premium dark finance aesthetic.
 * Step 7.2 — Design Tokens & Theme
 */

// ---------------------------------------------------------------------------
// Colors
// ---------------------------------------------------------------------------
export const Colors = {
  // Base
  background: '#F4F6F9',
  surface: '#FFFFFF',
  surfaceLight: '#F8FAFC',
  card: '#FFFFFF',
  cardBorder: '#E2E8F0',

  // Bank branding
  navy: '#0A1628',
  gold: '#C9A84C',
  goldLight: '#E0C97A',
  goldDark: '#9C7E2A',
  white: '#FFFFFF',

  // Text
  textPrimary: '#1E293B',
  textSecondary: '#475569',
  textMuted: '#64748B',

  // Accent
  primary: '#2563EB',
  primaryDark: '#1D4ED8',
  accent: '#059669',
  accentDark: '#047857',

  // Health score colors
  scoreGreen: '#10B981',
  scoreYellow: '#F59E0B',
  scoreRed: '#EF4444',

  // Risk badges
  riskConservative: '#3B82F6',
  riskModerate: '#F59E0B',
  riskAggressive: '#EF4444',

  // Product types
  savings: '#10B981',
  investment: '#3B82F6',
  loan: '#F97316',
  insurance: '#8B5CF6',

  // Status
  error: '#EF4444',
  success: '#10B981',
  warning: '#F59E0B',

  // Amount colors
  amountPositive: '#059669',
  amountNegative: '#EF4444',

  // Transparent
  overlay: 'rgba(10, 22, 40, 0.4)',
  glass: 'rgba(10, 22, 40, 0.03)',
  glassLight: 'rgba(10, 22, 40, 0.06)',
  glassMedium: 'rgba(10, 22, 40, 0.1)',
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
