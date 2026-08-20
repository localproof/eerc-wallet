/**
 * Design tokens ported from Prism (packages/mobile/src/theme/tokens.json).
 *
 * Prism uses NativeWind v4 with CSS variables; this app is bare RN with a
 * hard-won Metro config, so the tokens are mirrored into a StyleSheet theme
 * rather than pulling in NativeWind's babel/metro wrapper. Values must stay in
 * sync with tokens.json by hand.
 */
export const light = {
  background: '#F2F2F2',
  card: '#ffffff',
  cardActive: '#f1f5f9',
  textPrimary: '#0f172a',
  textSecondary: '#64748b',
  textTertiary: '#475569',
  textOnPrimary: '#ffffff',
  contentBody: '#363636',
  contentMuted: '#999999',
  border: '#e2e8f0',
  divider: '#e1e1e1',
  brand: '#ff6a00',
  primary: '#4f46e5',
  accent: '#506dff',
  success: '#26a17b',
  successLight: '#D0FFDA',
  destructive: '#ff5454',
  failedLight: '#FFD0D0',
  surfaceInverse: '#0A0A0A',
  pillNeutralBg: '#e8e8e8',
  headerButton: '#e8e8e8',
  statusSuccessBg: '#dbffd8',
  statusSuccessFg: '#118d08',
  statusFailedBg: '#ffdddd',
  statusFailedFg: '#fc0606',
} as const;

/** Prism's dark palette (tokens.json `dark`). */
export const dark = {
  background: '#0a0a0a',
  card: '#262626',
  cardActive: '#404040',
  textPrimary: '#fafafa',
  textSecondary: '#a3a3a3',
  textTertiary: '#d4d4d4',
  textOnPrimary: '#ffffff',
  contentBody: '#e5e5e5',
  contentMuted: '#999999',
  border: '#404040',
  divider: '#262626',
  brand: '#ff7437',
  primary: '#6366f1',
  accent: '#7b8fff',
  success: '#2eb88a',
  successLight: '#10331f',
  destructive: '#ff6b6b',
  failedLight: '#3a1414',
  surfaceInverse: '#fafafa',
  pillNeutralBg: '#262626',
  statusSuccessBg: '#10331f',
  statusSuccessFg: '#2eb88a',
  statusFailedBg: '#3a1414',
  statusFailedFg: '#ff6b6b',
} as const;

/** Active palette — Prism is a light design. `dark` is kept for reference. */
export const colors = light;

/** Prism disables Tailwind's fontWeight plugin — the face carries the weight. */
export const font = {
  regular: 'GoogleSansFlex-Regular',
  medium: 'GoogleSansFlex-Medium',
  semibold: 'GoogleSansFlex-SemiBold',
  bold: 'GoogleSansFlex-Bold',
  extrabold: 'GoogleSansFlex-ExtraBold',
} as const;

export const radius = { card: 24, inner: 20, pill: 999, field: 16 } as const;
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24 } as const;
