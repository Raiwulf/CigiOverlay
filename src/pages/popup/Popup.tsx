import React, { useEffect, useState } from 'react';
import Toggle from './Toggle';
import ThemeToggle from './ThemeToggle';
import { t, setLocale, getLocale } from '@src/utils/i18n';
import { initTheme, applyTheme } from '@src/utils/theme';
import '@assets/styles/tailwind.css';

export default function Popup() {
  const [overlayEnabled, setOverlayEnabled] = useState(false);
  const [floatingButtonEnabled, setFloatingButtonEnabled] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => initTheme());
  const [locale, setLocaleState] = useState<string>(() => getLocale());

  useEffect(() => {
    chrome.storage.local.get({ overlayEnabled: false, floatingButtonEnabled: false }, result => {
      setOverlayEnabled(!!result.overlayEnabled);
      setFloatingButtonEnabled(!!result.floatingButtonEnabled);
    });
  }, []);

  const handleOverlayToggle = (enabled: boolean) => {
    setOverlayEnabled(enabled);
    chrome.storage.local.set({ overlayEnabled: enabled });
  };

  const handleFloatingButtonToggle = (enabled: boolean) => {
    setFloatingButtonEnabled(enabled);
    chrome.storage.local.set({ floatingButtonEnabled: enabled });
  };

  const handleThemeChange = (value: 'light' | 'dark') => {
    setTheme(value);
    applyTheme(value);
  };

  const handleLocaleChange = async (value: string) => {
    setLocaleState(value);
    await setLocale(value);
    // trigger UI re-render by forcing state change (title text reads from t())
    // also notify content via storage change which is already listened
    chrome.storage.local.set({ localeOverride: value });
  };

  return (
    <div className="w-[300px] h-[260px] p-4 font-sans flex flex-col cigi-surface">
      <header className="mb-2">
        <h1 className="text-[16px] font-bold leading-tight">{t('popup_title')}</h1>
        <p className="text-[12px] cigi-muted mt-[2px]">{t('popup_subtitle')}</p>
      </header>
      <main className="flex-grow popup-rows">
        <div className="popup-row">
          <label className="font-medium cursor-pointer">Language</label>
          <select
            value={locale}
            onChange={(e) => handleLocaleChange(e.target.value)}
            className="popup-select"
            aria-label="Language"
          >
            <option value="en">English</option>
          </select>
        </div>
        <div className="popup-row">
          <label htmlFor="overlayToggle" className="font-medium cursor-pointer">
            {t('popup_overlay_label')}
          </label>
          <Toggle enabled={overlayEnabled} setEnabled={handleOverlayToggle} label={t('popup_overlay_label')} />
        </div>
        <div className="popup-row">
          <label className="font-medium cursor-pointer">{t('popup_theme_label')}</label>
          <ThemeToggle value={theme} onChange={handleThemeChange} />
        </div>
        <div className="popup-row">
          <label htmlFor="floatingButtonToggle" className="font-medium cursor-pointer">
            {t('popup_fab_label')}
          </label>
          <Toggle enabled={floatingButtonEnabled} setEnabled={handleFloatingButtonToggle} label={t('popup_fab_label')} />
        </div>
      </main>
      <footer className="pt-1 text-center text-[11px] cigi-muted">
        <p>{t('popup_version', ['1.0.0'])}</p>
      </footer>
    </div>
  );
}
