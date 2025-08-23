import React from 'react';
import { createRoot } from 'react-dom/client';
import Newtab from '@pages/newtab/Newtab';
import '@pages/newtab/index.css';
import '@assets/styles/tailwind.css';
import { t } from '@src/utils/i18n';

function init() {
  const rootContainer = document.querySelector("#__root");
  if (!rootContainer) throw new Error("Can't find Newtab root element");
  document.title = t('newtab_title');
  const root = createRoot(rootContainer);
  root.render(<Newtab />);
}

init();
