import React from 'react';
import { createRoot } from 'react-dom/client';
import Options from '@pages/options/Options';
import '@pages/options/index.css';
import { t } from '@src/utils/i18n';

function init() {
  const rootContainer = document.querySelector("#__root");
  if (!rootContainer) throw new Error("Can't find Options root element");
  document.title = t('options_title');
  const root = createRoot(rootContainer);
  root.render(<Options />);
}

init();
