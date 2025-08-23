export type ThemeName = 'light' | 'dark';

export type ThemePalette = {
  background: string; // app background
  surface: string; // card/panel background
  surfaceTranslucent: string; // translucent variant for overlays
  textPrimary: string;
  textSecondary: string;
  border: string;
  primary: string;
};

export const THEME_PALETTES: Record<ThemeName, ThemePalette> = {
  light: {
    background: '#f8fafc',
    surface: '#ffffff',
    surfaceTranslucent: 'rgba(255,255,255,0.85)',
    textPrimary: '#0f172a',
    textSecondary: '#475569',
    border: 'rgba(15,23,42,0.12)',
    primary: '#4f46e5',
  },
  dark: {
    background: '#0b101a',
    surface: '#111827',
    surfaceTranslucent: 'rgba(17,24,39,0.85)',
    textPrimary: '#f8fafc',
    textSecondary: '#94a3b8',
    border: 'rgba(255,255,255,0.15)',
    primary: '#6366f1',
  },
};

export const THEME_STYLE_ELEMENT_ID = '__cigi_theme_vars__';


