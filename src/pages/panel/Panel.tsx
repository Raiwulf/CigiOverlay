import React, { useEffect } from 'react';
import '@pages/panel/Panel.css';
import { t } from '@src/utils/i18n';
import { initTheme } from '@src/utils/theme';

export default function Panel() {
  useEffect(() => { initTheme(); }, []);
  return (
    <div className="container">
      <h1>{t('panel_title')}</h1>
    </div>
  );
}
