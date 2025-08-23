import React from 'react';

interface ToggleProps {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
  label?: string;
}

export default function Toggle({ enabled, setEnabled, label }: ToggleProps) {
  return (
    <button
      type="button"
      className={`${
        enabled ? 'bg-[var(--cigi-primary)]' : 'bg-[var(--cigi-border)]'
      } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none`}
      onClick={() => setEnabled(!enabled)}
      aria-pressed={enabled}
      aria-label={label || 'Toggle'}
    >
      <span
        aria-hidden="true"
        className={`${
          enabled ? 'translate-x-5' : 'translate-x-0'
        } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
      />
    </button>
  );
}
