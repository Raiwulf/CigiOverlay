import './style.css';
import { t } from '@src/utils/i18n';
import { applyTheme, resolveInitialTheme } from '@src/utils/theme';
import { initI18n } from '@src/utils/i18n';

type OverlayState = {
  overlayEnabled: boolean;
  floatingButtonEnabled: boolean;
};

const OVERLAY_CANVAS_ID = '__cigi_overlay_canvas__';
const FLOATING_BUTTON_ID = '__cigi_overlay_fab__';
const OVERLAY_WINDOW_ID = '__cigi_overlay_window__';
const ROOT_CONTAINER_ID = '__cigi_overlay_root__';
const WINDOW_POSITION_KEY = '__cigi_overlay_window_pos__';
const THEME_STORAGE_KEY = 'cigi_theme';

function log(...args: unknown[]) {
  try { console.log('[CIGI Overlay]', ...args); } catch {}
}

function hasChromeStorage(): boolean {
  // robust guard to prevent undefined access errors
  return typeof chrome !== 'undefined' && !!chrome && !!chrome.storage && !!chrome.storage.local;
}

function getOrCreateRootContainer(): HTMLDivElement {
  let root = document.getElementById(ROOT_CONTAINER_ID) as HTMLDivElement | null;
  if (!root) {
    root = document.createElement('div');
    root.id = ROOT_CONTAINER_ID;
    Object.assign(root.style, {
      position: 'fixed',
      inset: '0px',
      zIndex: '2147483646',
      display: 'block'
    } as CSSStyleDeclaration);
    document.documentElement.appendChild(root);
  }
  return root;
}

function removeRootContainer(): void {
  const root = document.getElementById(ROOT_CONTAINER_ID);
  if (root && root.parentElement) root.parentElement.removeChild(root);
}

// overlay canvas removed; root container now hosts all extension elements

function getOrCreateFloatingButton(): HTMLButtonElement {
  let btn = document.getElementById(FLOATING_BUTTON_ID) as HTMLButtonElement | null;
  if (!btn) {
    btn = document.createElement('button');
    btn.id = FLOATING_BUTTON_ID;
    btn.type = 'button';
    btn.title = t('popup_fab_label');
    Object.assign(btn.style, {
      position: 'fixed',
      top: 'calc(50vh - 20px)',
      right: '8px', // default snap side
      width: '40px',
      height: '40px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '9999px',
      background: 'var(--cigi-surface-translucent)',
      border: '1px solid var(--cigi-border)',
      boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
      zIndex: '2147483647',
      cursor: 'grab',
      padding: '0',
      pointerEvents: 'auto',
      backdropFilter: 'blur(4px)'
    } as CSSStyleDeclaration);

    const img = document.createElement('img');
    img.alt = 'CIGI';
    img.width = 32;
    img.height = 32;
    const iconFile = (import.meta as any).env && (import.meta as any).env.DEV ? 'dev-icon-32.png' : 'icon-32.png';
    try { img.src = chrome.runtime.getURL(iconFile); } catch { /* ignore */ }
    Object.assign(img.style, { width: '32px', height: '32px', objectFit: 'contain', pointerEvents: 'none' } as CSSStyleDeclaration);
    btn.appendChild(img);

    // dataset used to remember which side it's snapped to
    (btn as HTMLButtonElement).dataset.side = 'right';

    initDragBehavior(btn);
    btn.addEventListener('click', (e) => {
      const el = e.currentTarget as HTMLButtonElement | null;
      if (el && (el.dataset.wasdragged || '0') === '1') {
        el.dataset.wasdragged = '0';
        return;
      }
      openOverlayWindow();
    });

    const root = getOrCreateRootContainer();
    root.appendChild(btn);
  }
  return btn;
}

function removeFloatingButton(): void {
  const existing = document.getElementById(FLOATING_BUTTON_ID);
  if (existing && existing.parentElement) existing.parentElement.removeChild(existing);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function snapButtonToSide(btn: HTMLButtonElement): void {
  const rect = btn.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const snapLeft = centerX < window.innerWidth / 2;
  btn.style.transition = 'left 150ms ease-out, right 150ms ease-out, top 150ms ease-out';
  if (snapLeft) {
    btn.style.left = '8px';
    btn.style.right = 'auto';
    btn.dataset.side = 'left';
  } else {
    btn.style.left = 'auto';
    btn.style.right = '8px';
    btn.dataset.side = 'right';
  }
}

function initWindowDrag(win: HTMLDivElement, header: HTMLDivElement): void {
  let dragging = false;
  let startX = 0;
  let startY = 0;
  let origLeft = 0;
  let origTop = 0;

  const onPointerDown = (e: PointerEvent) => {
    // ignore drag when interacting with controls
    const t = e.target as HTMLElement | null;
    if (t && (t.closest('button') || t.closest('select') || t.closest('input'))) return;
    dragging = true;
    try { header.setPointerCapture(e.pointerId); } catch {}
    const rect = win.getBoundingClientRect();
    origLeft = rect.left;
    origTop = rect.top;
    startX = e.clientX;
    startY = e.clientY;
    win.style.transition = 'none';
    win.style.left = rect.left + 'px';
    win.style.top = rect.top + 'px';
    win.style.right = 'auto';
    header.style.cursor = 'grabbing';
  };

  const onPointerMove = (e: PointerEvent) => {
    if (!dragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    const w = win.offsetWidth || 720;
    const h = win.offsetHeight || 400;
    const newLeft = clamp(origLeft + dx, 4, Math.max(4, window.innerWidth - w - 4));
    const newTop = clamp(origTop + dy, 4, Math.max(4, window.innerHeight - h - 4));
    win.style.left = newLeft + 'px';
    win.style.top = newTop + 'px';
  };

  const onPointerUp = (e: PointerEvent) => {
    if (!dragging) return;
    dragging = false;
    try { header.releasePointerCapture(e.pointerId); } catch {}
    header.style.cursor = 'grab';
    // persist position
    const left = parseFloat(win.style.left || '0');
    const top = parseFloat(win.style.top || '0');
    saveWindowPosition(left, top);
  };

  header.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);
}

function initWindowResizeHandle(win: HTMLDivElement): void {
  const handle = document.createElement('div');
  Object.assign(handle.style, {
    position: 'absolute',
    bottom: '6px',
    right: '6px',
    width: '16px',
    height: '16px',
    cursor: 'se-resize',
    borderRight: '2px solid var(--cigi-border)',
    borderBottom: '2px solid var(--cigi-border)',
    borderBottomRightRadius: '3px',
    opacity: '0.9'
  } as CSSStyleDeclaration);

  const minW = 360; // px
  const minH = 200; // px

  let resizing = false;
  let startX = 0;
  let startY = 0;
  let startW = 0;
  let startH = 0;

  const onPointerDown = (e: PointerEvent) => {
    resizing = true;
    try { handle.setPointerCapture(e.pointerId); } catch {}
    const rect = win.getBoundingClientRect();
    startW = rect.width;
    startH = rect.height;
    startX = e.clientX;
    startY = e.clientY;
  };

  const onPointerMove = (e: PointerEvent) => {
    if (!resizing) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    const left = win.getBoundingClientRect().left;
    const top = win.getBoundingClientRect().top;
    const maxW = Math.max(minW, window.innerWidth - left - 8);
    const maxH = Math.max(minH, window.innerHeight - top - 8);
    const newW = clamp(startW + dx, minW, maxW);
    const newH = clamp(startH + dy, minH, maxH);
    win.style.width = newW + 'px';
    win.style.height = newH + 'px';
  };

  const onPointerUp = (e: PointerEvent) => {
    if (!resizing) return;
    resizing = false;
    try { handle.releasePointerCapture(e.pointerId); } catch {}
  };

  handle.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);

  win.appendChild(handle);
}

function saveWindowPosition(left: number, top: number): void {
  const pos = { left, top };
  try {
    if (hasChromeStorage()) {
      chrome.storage.local.set({ [WINDOW_POSITION_KEY]: pos });
    } else {
      localStorage.setItem(WINDOW_POSITION_KEY, JSON.stringify(pos));
    }
  } catch {}
}

function applySavedPosition(win: HTMLDivElement): void {
  try {
    const apply = (pos: any) => {
      if (!pos || typeof pos.left !== 'number' || typeof pos.top !== 'number') return;
      const w = win.offsetWidth || 720;
      const h = win.offsetHeight || 400;
      const clampedLeft = clamp(pos.left, 4, Math.max(4, window.innerWidth - w - 4));
      const clampedTop = clamp(pos.top, 4, Math.max(4, window.innerHeight - h - 4));
      win.style.left = clampedLeft + 'px';
      win.style.top = clampedTop + 'px';
      win.style.right = 'auto';
    };
    if (hasChromeStorage()) {
      chrome.storage.local.get({ [WINDOW_POSITION_KEY]: null }, (res) => apply(res[WINDOW_POSITION_KEY]));
    } else {
      const raw = localStorage.getItem(WINDOW_POSITION_KEY);
      if (!raw) return; apply(JSON.parse(raw));
    }
  } catch {}
}

function initDragBehavior(btn: HTMLButtonElement): void {
  let dragging = false;
  let startX = 0;
  let startY = 0;
  let origLeft = 0;
  let origTop = 0;
  let moved = false;

  const onPointerDown = (e: PointerEvent) => {
    dragging = true;
    try { btn.setPointerCapture(e.pointerId); } catch {}
    btn.style.transition = 'none';
    const rect = btn.getBoundingClientRect();
    origLeft = rect.left;
    origTop = rect.top;
    startX = e.clientX;
    startY = e.clientY;
    btn.style.left = rect.left + 'px';
    btn.style.top = rect.top + 'px';
    btn.style.right = 'auto';
    btn.style.cursor = 'grabbing';
    moved = false;
  };

  const onPointerMove = (e: PointerEvent) => {
    if (!dragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) moved = true;
    const w = btn.offsetWidth || 40;
    const h = btn.offsetHeight || 40;
    const newLeft = clamp(origLeft + dx, 4, window.innerWidth - w - 4);
    const newTop = clamp(origTop + dy, 4, window.innerHeight - h - 4);
    btn.style.left = newLeft + 'px';
    btn.style.top = newTop + 'px';
  };

  const onPointerUp = (e: PointerEvent) => {
    if (!dragging) return;
    dragging = false;
    try { btn.releasePointerCapture(e.pointerId); } catch {}
    btn.style.cursor = 'grab';
    snapButtonToSide(btn);
    btn.dataset.wasdragged = moved ? '1' : '0';
  };

  btn.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);
}

function hideFloatingButton(): void {
  const btn = document.getElementById(FLOATING_BUTTON_ID) as HTMLButtonElement | null;
  if (btn) btn.style.display = 'none';
}

function showFloatingButton(): void {
  const btn = getOrCreateFloatingButton();
  btn.style.display = 'flex';
}

function createThemeToggleButton(): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.title = t('popup_theme_label');
  Object.assign(btn.style, {
    width: '44px', height: '28px', borderRadius: '9999px',
    border: '1px solid var(--cigi-border)', background: 'transparent',
    color: 'var(--cigi-text)', cursor: 'pointer', display: 'inline-flex',
    alignItems: 'center', justifyContent: 'center'
  } as CSSStyleDeclaration);
  const icon = document.createElement('span');
  icon.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>';
  btn.appendChild(icon);
  btn.addEventListener('click', () => {
    const next = (document.documentElement.dataset.theme === 'dark') ? 'light' : 'dark';
    applyTheme(next as 'light' | 'dark');
    icon.innerHTML = next === 'dark'
      ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>'
      : '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M6.76 4.84l-1.8-1.79-1.41 1.41 1.79 1.8 1.42-1.42zM1 13h3v-2H1v2zm10 10h2v-3h-2v3zm9-10v2h3v-2h-3zm-3.95 7.95l1.41 1.41 1.8-1.79-1.41-1.41-1.8 1.79zM13 1h-2v3h2V1zm4.24 3.05l1.8-1.79-1.41-1.41-1.8 1.79 1.41 1.41zM4.22 17.66l-1.8 1.79 1.41 1.41 1.8-1.79-1.41-1.41zM12 6a6 6 0 1 0 0 12A6 6 0 0 0 12 6z"></path></svg>';
  });
  return btn;
}

function getOrCreateOverlayWindow(): HTMLDivElement {
  let win = document.getElementById(OVERLAY_WINDOW_ID) as HTMLDivElement | null;
  if (!win) {
    win = document.createElement('div');
    win.id = OVERLAY_WINDOW_ID;
    Object.assign(win.style, {
      position: 'fixed',
      top: '10vh',
      right: '16px',
      width: '720px',
      height: '68vh',
      zIndex: '2147483647',
      pointerEvents: 'auto',
      background: 'var(--cigi-surface-translucent)',
      color: 'var(--cigi-text)',
      borderRadius: '14px',
      boxShadow: '0 24px 48px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      border: '1px solid var(--cigi-border)'
    } as CSSStyleDeclaration);

    const header = document.createElement('div');
    Object.assign(header.style, {
      height: '48px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 14px',
      borderBottom: '1px solid var(--cigi-border)',
      cursor: 'grab',
      background: 'transparent'
    } as CSSStyleDeclaration);
    const title = document.createElement('div');
    title.textContent = t('content_overlay_title');
    Object.assign(title.style, { fontWeight: '700', letterSpacing: '0.2px' } as CSSStyleDeclaration);
    const controls = document.createElement('div');
    Object.assign(controls.style, { display: 'flex', alignItems: 'center', gap: '6px' } as CSSStyleDeclaration);
    const themeBtn = createThemeToggleButton();
    const minimizeBtn = document.createElement('button');
    minimizeBtn.textContent = '–';
    minimizeBtn.title = t('content_overlay_minimize');
    Object.assign(minimizeBtn.style, {
      width: '28px', height: '28px', borderRadius: '6px',
      border: '1px solid var(--cigi-border)',
      background: 'transparent', color: 'var(--cigi-text)',
      cursor: 'pointer'
    } as CSSStyleDeclaration);
    minimizeBtn.addEventListener('click', () => minimizeOverlayWindow());
    controls.appendChild(themeBtn);
    controls.appendChild(minimizeBtn);
    header.appendChild(title);
    header.appendChild(controls);

    const body = document.createElement('div');
    Object.assign(body.style, {
      flex: '1 1 auto',
      display: 'flex',
      minHeight: '0'
    } as CSSStyleDeclaration);
    const tabs = document.createElement('div');
    Object.assign(tabs.style, {
      width: '180px', borderRight: '1px solid var(--cigi-border)',
      padding: '8px', display: 'flex', flexDirection: 'column', gap: '6px'
    } as CSSStyleDeclaration);
    const styleNav = (el: HTMLButtonElement) => {
      Object.assign(el.style, {
        textAlign: 'left', padding: '6px 10px',
        borderRadius: '8px', border: '1px solid var(--cigi-border)',
        background: 'rgba(255,255,255,0.04)', color: 'var(--cigi-text)', cursor: 'pointer',
        transition: 'background 120ms ease, transform 120ms ease, border-color 120ms ease'
      } as CSSStyleDeclaration);
      el.addEventListener('mouseenter', () => {
        el.style.background = 'rgba(255,255,255,0.08)';
        el.style.transform = 'translateY(-1px)';
      });
      el.addEventListener('mouseleave', () => {
        el.style.background = 'rgba(255,255,255,0.05)';
        el.style.transform = 'translateY(0)';
      });
      el.addEventListener('focus', () => { el.style.borderColor = 'var(--cigi-primary)'; });
      el.addEventListener('blur', () => { el.style.borderColor = 'var(--cigi-border)'; });
    };
    ;[t('content_overlay_tab_overview'), t('content_overlay_tab_layers'), t('content_overlay_tab_settings')].forEach(tl => {
      const item = document.createElement('button');
      item.textContent = tl;
      styleNav(item as HTMLButtonElement);
      tabs.appendChild(item);
    });
    const panel = document.createElement('div');
    Object.assign(panel.style, { flex: '1 1 auto', padding: '10px' } as CSSStyleDeclaration);
    // Empty panel area for now

    body.appendChild(tabs);
    body.appendChild(panel);

    win.appendChild(header);
    win.appendChild(body);

    // enable dragging by header
    initWindowDrag(win, header);

    // try to restore previous saved position
    applySavedPosition(win);

    // add bottom-right resize handle
    initWindowResizeHandle(win);

    const root = getOrCreateRootContainer();
    root.appendChild(win);
  }
  return win;
}

function openOverlayWindow(): void {
  // hide FAB and show window
  hideFloatingButton();
  getOrCreateOverlayWindow().style.display = 'flex';
}

function minimizeOverlayWindow(): void {
  const win = document.getElementById(OVERLAY_WINDOW_ID) as HTMLDivElement | null;
  if (win) win.style.display = 'none';
  // restore FAB visibility only if setting is enabled
  if (hasChromeStorage()) {
    chrome.storage.local.get({ floatingButtonEnabled: false }, (result) => {
      if (!!result.floatingButtonEnabled) {
        showFloatingButton();
      } else {
        removeFloatingButton();
      }
    });
  } else {
    removeFloatingButton();
  }
}

function removeOverlayWindow(): void {
  const win = document.getElementById(OVERLAY_WINDOW_ID) as HTMLDivElement | null;
  if (win && win.parentElement) win.parentElement.removeChild(win);
}

function resizeCanvasToViewport(canvas: HTMLCanvasElement): void {
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  const rectWidth = window.innerWidth;
  const rectHeight = window.innerHeight;
  const targetWidth = Math.floor(rectWidth * dpr);
  const targetHeight = Math.floor(rectHeight * dpr);
  if (canvas.width !== targetWidth) canvas.width = targetWidth;
  if (canvas.height !== targetHeight) canvas.height = targetHeight;
}

// no-op: overlay drawing removed

function applyState(state: OverlayState): void {
  if (state.overlayEnabled) {
    // ensure root exists for extension elements
    getOrCreateRootContainer();
    if (state.floatingButtonEnabled) {
      getOrCreateFloatingButton();
    } else {
      removeFloatingButton();
      removeOverlayWindow();
    }
  } else {
    removeFloatingButton();
    removeOverlayWindow();
    removeRootContainer();
  }
}

function readStateAndApply(): void {
  if (hasChromeStorage()) {
    chrome.storage.local.get({ overlayEnabled: false, floatingButtonEnabled: false }, (result) => {
      applyState({ overlayEnabled: !!result.overlayEnabled, floatingButtonEnabled: !!result.floatingButtonEnabled });
    });
  } else {
    log('chrome.storage is not available; overlay will stay disabled.');
  }
}

function ensureWindowWithinViewport(): void {
  const win = document.getElementById(OVERLAY_WINDOW_ID) as HTMLDivElement | null;
  if (!win) return;
  const rect = win.getBoundingClientRect();
  const w = rect.width;
  const h = rect.height;
  let left = rect.left;
  let top = rect.top;
  const maxLeft = Math.max(4, window.innerWidth - w - 4);
  const maxTop = Math.max(4, window.innerHeight - h - 4);
  left = clamp(left, 4, maxLeft);
  top = clamp(top, 4, maxTop);
  win.style.left = left + 'px';
  win.style.top = top + 'px';
  win.style.right = 'auto';
}

function initResizeHandler(): () => void {
  const handler = () => {
    if (hasChromeStorage()) {
      chrome.storage.local.get({ overlayEnabled: false, floatingButtonEnabled: false }, (result) => {
        if (!!result.overlayEnabled) {
          ensureWindowWithinViewport();
        }
        // ensure button snaps to correct side on resize
        const btn = document.getElementById(FLOATING_BUTTON_ID) as HTMLButtonElement | null;
        if (btn && !!result.floatingButtonEnabled) snapButtonToSide(btn);
      });
    }
  };
  window.addEventListener('resize', handler);
  return () => window.removeEventListener('resize', handler);
}

function initStorageListener(): () => void {
  if (!hasChromeStorage() || !chrome.storage.onChanged) {
    log('storage.onChanged not available; live updates disabled.');
    return () => {};
  }
  const listener: Parameters<typeof chrome.storage.onChanged.addListener>[0] = (changes, area) => {
    if (area !== 'local') return;
    if (changes && Object.prototype.hasOwnProperty.call(changes, 'localeOverride')) {
      initI18n().then(() => {
        // re-create overlay window header texts
        const win = document.getElementById(OVERLAY_WINDOW_ID) as HTMLDivElement | null;
        if (win) {
          removeOverlayWindow();
          getOrCreateOverlayWindow().style.display = 'flex';
        }
      });
    }
    readStateAndApply();
  };
  chrome.storage.onChanged.addListener(listener);
  return () => chrome.storage.onChanged.removeListener(listener);
}

function init(): void {
  log('content script loaded');
  // apply theme early
  const initialTheme = (() => {
    try { return (localStorage.getItem(THEME_STORAGE_KEY) as 'light' | 'dark') || resolveInitialTheme(); } catch { return resolveInitialTheme(); }
  })();
  applyTheme(initialTheme);
  // initialize i18n override if present
  initI18n().then(() => {
    // ensure any strings created after this use the override
  });
  readStateAndApply();
  const removeStorageListener = initStorageListener();
  const removeResize = initResizeHandler();
  window.addEventListener('beforeunload', () => {
    removeStorageListener();
    removeResize();
  });
}

init();
