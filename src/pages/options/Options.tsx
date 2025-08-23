import React, { useEffect } from 'react';
import '@pages/options/Options.css';
import { t } from '@src/utils/i18n';
import { initTheme } from '@src/utils/theme';

export default function Options() {
  useEffect(() => { initTheme(); document.title = t('options_title'); }, []);
  return <div className="container">{t('options_title')}</div>;
}
