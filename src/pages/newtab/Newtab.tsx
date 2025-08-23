import React, { useEffect } from 'react';
import logo from '@assets/img/logo.svg';
import '@pages/newtab/Newtab.css';
import { t } from '@src/utils/i18n';
import { initTheme } from '@src/utils/theme';

export default function Newtab() {
  useEffect(() => { initTheme(); }, []);
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          {t('newtab_edit')}
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          {t('newtab_learn')}
        </a>
      </header>
    </div>
  );
}
