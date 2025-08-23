import { THEME_PALETTES, THEME_STYLE_ELEMENT_ID, ThemeName } from '@src/constants/colors';

export function getStoredTheme(): ThemeName | null {
  try {
    const value = localStorage.getItem('cigi_theme');
    return (value === 'light' || value === 'dark') ? value : null;
  } catch {
    return null;
  }
}

export function resolveInitialTheme(): ThemeName {
  const stored = getStoredTheme();
  if (stored) return stored;
  try {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  } catch {
    return 'dark';
  }
}

function ensureThemeStyleElement(): HTMLStyleElement {
  let el = document.getElementById(THEME_STYLE_ELEMENT_ID) as HTMLStyleElement | null;
  if (!el) {
    el = document.createElement('style');
    el.id = THEME_STYLE_ELEMENT_ID;
    document.head.appendChild(el);
  }
  return el;
}

export function applyTheme(theme: ThemeName): void {
  const palette = THEME_PALETTES[theme];
  const styleEl = ensureThemeStyleElement();
  const css = `:root{--cigi-bg:${palette.background};--cigi-surface:${palette.surface};--cigi-surface-translucent:${palette.surfaceTranslucent};--cigi-text:${palette.textPrimary};--cigi-text-muted:${palette.textSecondary};--cigi-border:${palette.border};--cigi-primary:${palette.primary};}`;
  styleEl.textContent = css;
  try { localStorage.setItem('cigi_theme', theme); } catch {}
  document.documentElement.dataset.theme = theme;
}

export function initTheme(): ThemeName {
  const theme = resolveInitialTheme();
  applyTheme(theme);
  return theme;
}


