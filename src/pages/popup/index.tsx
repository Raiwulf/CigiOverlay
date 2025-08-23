import React from 'react';
import { createRoot } from 'react-dom/client';
import '@pages/popup/index.css';
import '@assets/styles/tailwind.css';
import Popup from '@pages/popup/Popup';
import { t } from '@src/utils/i18n';
import { initI18n } from '@src/utils/i18n';

function init() {
  const rootContainer = document.querySelector("#__root");
  if (!rootContainer) throw new Error("Can't find Popup root element");
  initI18n().then(() => {
    document.title = t('popup_title');
    const root = createRoot(rootContainer);
    root.render(<Popup />);
  });
}

init();
