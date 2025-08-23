import Browser from 'webextension-polyfill';
import { t } from '@src/utils/i18n';

Browser
  .devtools
  .panels
  .create(t('devtools_title'), 'icon-32.png', 'src/pages/devtools/index.html')
  .catch(console.error);
