import React, { useEffect, useState } from 'react';
import Toggle from './Toggle';

export default function Popup() {
  const [overlayEnabled, setOverlayEnabled] = useState(false);
  const [devModeEnabled, setDevModeEnabled] = useState(false);
  const [floatingButtonEnabled, setFloatingButtonEnabled] = useState(false);

  useEffect(() => {
    chrome.storage.local.get({ overlayEnabled: false, devModeEnabled: false, floatingButtonEnabled: false }, result => {
      setOverlayEnabled(!!result.overlayEnabled);
      setDevModeEnabled(!!result.devModeEnabled);
      setFloatingButtonEnabled(!!result.floatingButtonEnabled);
    });
  }, []);

  const handleOverlayToggle = (enabled: boolean) => {
    setOverlayEnabled(enabled);
    chrome.storage.local.set({ overlayEnabled: enabled });
  };

  const handleDevModeToggle = (enabled: boolean) => {
    setDevModeEnabled(enabled);
    chrome.storage.local.set({ devModeEnabled: enabled });
  };

  const handleFloatingButtonToggle = (enabled: boolean) => {
    setFloatingButtonEnabled(enabled);
    chrome.storage.local.set({ floatingButtonEnabled: enabled });
  };

  return (
    <div className="w-[300px] h-[260px] p-4 bg-gray-800 text-white font-sans flex flex-col">
      <header className="mb-4">
        <h1 className="text-xl font-bold">Cigi Overlay</h1>
        <p className="text-sm text-gray-400">Control your settings</p>
      </header>
      <main className="flex-grow space-y-4">
        <div className="flex items-center justify-between py-2 border-b border-gray-700">
          <label htmlFor="overlayToggle" className="font-medium cursor-pointer">
            Enable CIGI Overlay
          </label>
          <Toggle enabled={overlayEnabled} setEnabled={handleOverlayToggle} label="Enable CIGI Overlay" />
        </div>
        <div className="flex items-center justify-between py-2 border-b border-gray-700">
          <label htmlFor="devModeToggle" className="font-medium cursor-pointer">
            Dev Mode: Paint Overlay
          </label>
          <Toggle enabled={devModeEnabled} setEnabled={handleDevModeToggle} label="Dev Mode: Paint Overlay" />
        </div>
        <div className="flex items-center justify-between py-2">
          <label htmlFor="floatingButtonToggle" className="font-medium cursor-pointer">
            Show Floating Button
          </label>
          <Toggle enabled={floatingButtonEnabled} setEnabled={handleFloatingButtonToggle} label="Show Floating Button" />
        </div>
      </main>
      <footer className="pt-2 text-center text-xs text-gray-500">
        <p>Version 1.0.0</p>
      </footer>
    </div>
  );
}
