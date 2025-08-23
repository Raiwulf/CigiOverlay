import React from 'react';
import { t } from '@src/utils/i18n';

type ThemeValue = 'light' | 'dark';

interface ThemeToggleProps {
  value: ThemeValue;
  onChange: (next: ThemeValue) => void;
}

export default function ThemeToggle({ value, onChange }: ThemeToggleProps) {
  const isDark = value === 'dark';
  return (
    <button
      type="button"
      aria-label={t('popup_theme_label')}
      className={`${isDark ? 'bg-[var(--cigi-primary)]' : 'bg-[var(--cigi-border)]'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none`}
      onClick={() => onChange(isDark ? 'light' : 'dark')}
    >
      <span
        className={`${isDark ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-flex h-5 w-5 transform items-center justify-center rounded-full bg-white shadow transition duration-200 ease-in-out`}
        aria-hidden="true"
      >
        {isDark ? (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="#0b101a" aria-hidden="true">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
          </svg>
        ) : (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="#f59e0b" aria-hidden="true">
            <path d="M6.76 4.84l-1.8-1.79-1.41 1.41 1.79 1.8 1.42-1.42zM1 13h3v-2H1v2zm10 10h2v-3h-2v3zm9-10v2h3v-2h-3zm-3.95 7.95l1.41 1.41 1.8-1.79-1.41-1.41-1.8 1.79zM13 1h-2v3h2V1zm4.24 3.05l1.8-1.79-1.41-1.41-1.8 1.79 1.41 1.41zM4.22 17.66l-1.8 1.79 1.41 1.41 1.8-1.79-1.41-1.41zM12 6a6 6 0 1 0 0 12A6 6 0 0 0 12 6z"></path>
          </svg>
        )}
      </span>
    </button>
  );
}


