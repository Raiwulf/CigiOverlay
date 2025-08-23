export type I18nSubstitutions = string | string[] | undefined;

let overrideLocale: string | null = null;
let messageMap: Record<string, string> | null = null;

function hasChromeI18n(): boolean {
  try {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    return typeof chrome !== 'undefined' && !!(chrome as any)?.i18n && typeof chrome.i18n.getMessage === 'function';
  } catch {
    return false;
  }
}

export function t(key: string, substitutions?: I18nSubstitutions): string {
  if (!key) return '';
  if (messageMap && Object.prototype.hasOwnProperty.call(messageMap, key)) {
    return messageMap[key];
  }
  try {
    if (hasChromeI18n()) {
      const msg = chrome.i18n.getMessage(key, substitutions as any);
      if (msg && msg.length > 0) return msg;
    }
  } catch {}
  // fallback to key if not localized
  if (Array.isArray(substitutions) && substitutions.length) {
    return `${key}: ${substitutions.join(' ')}`;
  }
  return key;
}

async function fetchMessages(locale: string): Promise<Record<string, string> | null> {
  try {
    const baseUrl = hasChromeI18n() && (chrome as any)?.runtime?.getURL ? chrome.runtime.getURL('') : '';
    const url = `${baseUrl}_locales/${locale}/messages.json`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return null;
    const json = await res.json();
    const map: Record<string, string> = {};
    Object.keys(json || {}).forEach((k) => {
      const v = json[k] && json[k].message;
      if (typeof v === 'string') map[k] = v;
    });
    return map;
  } catch {
    return null;
  }
}

export async function initI18n(): Promise<void> {
  try {
    if (typeof chrome !== 'undefined' && chrome?.storage?.local) {
      await new Promise<void>((resolve) => {
        chrome.storage.local.get({ localeOverride: null }, async (result) => {
          overrideLocale = result?.localeOverride || null;
          if (overrideLocale) {
            messageMap = await fetchMessages(overrideLocale);
          }
          resolve();
        });
      });
    }
  } catch {}
}

export async function setLocale(locale: string): Promise<void> {
  overrideLocale = locale;
  messageMap = await fetchMessages(locale);
  try {
    if (typeof chrome !== 'undefined' && chrome?.storage?.local) {
      await new Promise<void>((resolve) => chrome.storage.local.set({ localeOverride: locale }, () => resolve()));
    }
  } catch {}
}

export function getLocale(): string {
  return overrideLocale || 'en';
}


