import './style.css';

type OverlayState = {
  overlayEnabled: boolean;
  devModeEnabled: boolean;
  floatingButtonEnabled: boolean;
};

const OVERLAY_CANVAS_ID = '__cigi_overlay_canvas__';
const FLOATING_BUTTON_ID = '__cigi_overlay_fab__';
const OVERLAY_WINDOW_ID = '__cigi_overlay_window__';

function log(...args: unknown[]) {
  try { console.log('[CIGI Overlay]', ...args); } catch {}
}

function hasChromeStorage(): boolean {
  // robust guard to prevent undefined access errors
  return typeof chrome !== 'undefined' && !!chrome && !!chrome.storage && !!chrome.storage.local;
}

function getOrCreateOverlayCanvas(): HTMLCanvasElement {
  let canvas = document.getElementById(OVERLAY_CANVAS_ID) as HTMLCanvasElement | null;
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.id = OVERLAY_CANVAS_ID;
    Object.assign(canvas.style, {
      position: 'fixed',
      inset: '0px',
      width: '100vw',
      height: '100vh',
      pointerEvents: 'none',
      zIndex: '2147483646',
      display: 'block',
    });
    document.documentElement.appendChild(canvas);
  }
  return canvas;
}

function removeOverlayCanvas(): void {
  const existing = document.getElementById(OVERLAY_CANVAS_ID);
  if (existing && existing.parentElement) existing.parentElement.removeChild(existing);
}

function getOrCreateFloatingButton(): HTMLButtonElement {
  let btn = document.getElementById(FLOATING_BUTTON_ID) as HTMLButtonElement | null;
  if (!btn) {
    btn = document.createElement('button');
    btn.id = FLOATING_BUTTON_ID;
    btn.type = 'button';
    btn.title = 'CIGI Floating Button';
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
      background: 'rgba(17,17,17,0.6)',
      border: '1px solid rgba(255,255,255,0.2)',
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

    document.documentElement.appendChild(btn);
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
      height: '70vh',
      zIndex: '2147483647',
      pointerEvents: 'auto',
      background: 'rgba(17,17,17,0.9)',
      color: '#fff',
      borderRadius: '12px',
      boxShadow: '0 12px 24px rgba(0,0,0,0.45)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      border: '1px solid rgba(255,255,255,0.15)'
    } as CSSStyleDeclaration);

    const header = document.createElement('div');
    Object.assign(header.style, {
      height: '44px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 12px',
      borderBottom: '1px solid rgba(255,255,255,0.12)'
    } as CSSStyleDeclaration);
    const title = document.createElement('div');
    title.textContent = 'CIGI Overlay';
    Object.assign(title.style, { fontWeight: '600' } as CSSStyleDeclaration);
    const minimizeBtn = document.createElement('button');
    minimizeBtn.textContent = '–';
    minimizeBtn.title = 'Minimize';
    Object.assign(minimizeBtn.style, {
      width: '28px', height: '28px', borderRadius: '6px',
      border: '1px solid rgba(255,255,255,0.18)',
      background: 'rgba(255,255,255,0.06)', color: '#fff',
      cursor: 'pointer'
    } as CSSStyleDeclaration);
    minimizeBtn.addEventListener('click', () => minimizeOverlayWindow());
    header.appendChild(title);
    header.appendChild(minimizeBtn);

    const body = document.createElement('div');
    Object.assign(body.style, {
      flex: '1 1 auto',
      display: 'flex',
      minHeight: '0'
    } as CSSStyleDeclaration);
    const tabs = document.createElement('div');
    Object.assign(tabs.style, {
      width: '200px', borderRight: '1px solid rgba(255,255,255,0.12)',
      padding: '8px', display: 'flex', flexDirection: 'column', gap: '6px'
    } as CSSStyleDeclaration);
    ;['Overview','Layers','Settings'].forEach(t => {
      const item = document.createElement('button');
      item.textContent = t;
      Object.assign(item.style, {
        textAlign: 'left', padding: '8px 10px',
        borderRadius: '8px', border: '1px solid rgba(255,255,255,0.12)',
        background: 'rgba(255,255,255,0.05)', color: '#fff', cursor: 'pointer'
      } as CSSStyleDeclaration);
      tabs.appendChild(item);
    });
    const panel = document.createElement('div');
    Object.assign(panel.style, { flex: '1 1 auto' } as CSSStyleDeclaration);
    // Empty panel area for now

    body.appendChild(tabs);
    body.appendChild(panel);

    win.appendChild(header);
    win.appendChild(body);

    document.documentElement.appendChild(win);
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
  // restore FAB visibility
  showFloatingButton();
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

function renderOverlay(canvas: HTMLCanvasElement, devModeEnabled: boolean): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (devModeEnabled) {
    ctx.fillStyle = 'rgba(255, 0, 0, 0.25)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // visible label to confirm painting
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.font = 'bold 16px system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Arial, sans-serif';
    ctx.fillText('CIGI DEV OVERLAY', 12, 24);
  }
}

function applyState(state: OverlayState): void {
  if (state.overlayEnabled) {
    const canvas = getOrCreateOverlayCanvas();
    resizeCanvasToViewport(canvas);
    renderOverlay(canvas, state.devModeEnabled);
    if (state.floatingButtonEnabled) {
      getOrCreateFloatingButton();
    } else {
      removeFloatingButton();
      minimizeOverlayWindow();
    }
  } else {
    removeOverlayCanvas();
    removeFloatingButton();
    removeOverlayWindow();
  }
}

function readStateAndApply(): void {
  if (hasChromeStorage()) {
    chrome.storage.local.get({ overlayEnabled: false, devModeEnabled: false, floatingButtonEnabled: false }, (result) => {
      applyState({ overlayEnabled: !!result.overlayEnabled, devModeEnabled: !!result.devModeEnabled, floatingButtonEnabled: !!result.floatingButtonEnabled });
    });
  } else {
    log('chrome.storage is not available; overlay will stay disabled.');
  }
}

function initResizeHandler(): () => void {
  const handler = () => {
    const canvas = document.getElementById(OVERLAY_CANVAS_ID) as HTMLCanvasElement | null;
    if (!canvas) return;
    resizeCanvasToViewport(canvas);
    if (hasChromeStorage()) {
      chrome.storage.local.get({ overlayEnabled: false, devModeEnabled: false, floatingButtonEnabled: false }, (result) => {
        renderOverlay(canvas!, !!result.devModeEnabled);
        if (!result.overlayEnabled) removeOverlayCanvas();
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
  const listener: Parameters<typeof chrome.storage.onChanged.addListener>[0] = (_changes, area) => {
    if (area !== 'local') return;
    readStateAndApply();
  };
  chrome.storage.onChanged.addListener(listener);
  return () => chrome.storage.onChanged.removeListener(listener);
}

function init(): void {
  log('content script loaded');
  readStateAndApply();
  const removeStorageListener = initStorageListener();
  const removeResize = initResizeHandler();
  window.addEventListener('beforeunload', () => {
    removeStorageListener();
    removeResize();
  });
}

init();
