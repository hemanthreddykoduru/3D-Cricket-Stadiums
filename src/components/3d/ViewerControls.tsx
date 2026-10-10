'use client';

import { Building2, Eye, Flag, Maximize2, Minimize2, Mountain, RotateCcw } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { CameraPreset } from '@/types/stadium';

interface Props {
  onPreset: (preset: CameraPreset) => void;
  onReset: () => void;
  current: CameraPreset;
  onFullscreen: () => void | Promise<void>;
  isFullscreen: boolean;
  fullscreenPending?: boolean;
}

const PRESETS: Array<{ id: CameraPreset; label: string; icon: LucideIcon }> = [
  { id: 'overview', label: 'Overview', icon: Eye },
  { id: 'top', label: 'Top-down', icon: Mountain },
  { id: 'pitch', label: 'Pitch view', icon: Flag },
  { id: 'stand', label: 'Side view', icon: Building2 },
];

export function ViewerControls({ onPreset, onReset, current, onFullscreen, isFullscreen, fullscreenPending }: Props) {
  return (
    <div className="glass w-full min-w-0 max-w-full rounded-lg p-1.5 md:max-h-[calc(100dvh-10rem)] md:overflow-y-auto md:w-48" role="group" aria-label="Camera and display controls">
      <div className="hidden px-2.5 py-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-ink-muted md:block">
        Camera views
      </div>
      <div className="grid grid-cols-2 gap-1 min-[360px]:grid-cols-4 md:grid-cols-1">
        {PRESETS.map((preset) => {
          const Icon = preset.icon;
          const active = current === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onPreset(preset.id)}
              title={preset.label}
              aria-label={preset.label}
              aria-pressed={active}
              className={`focus-ring flex min-h-11 min-w-0 flex-col items-center justify-center gap-1.5 rounded px-1 py-2 text-center text-[10px] leading-tight transition-colors md:flex-row md:justify-start md:gap-2 md:px-2.5 md:text-left md:text-[12px] ${
                active ? 'bg-accent text-on-accent' : 'text-ink-muted hover:bg-surface-900 hover:text-ink-main'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="min-w-0 max-w-full break-words">{preset.label}</span>
            </button>
          );
        })}
      </div>
      <div className="my-1.5 h-px bg-line" />
      <div className="grid grid-cols-2 gap-1 md:grid-cols-1">
        <button
          type="button"
          onClick={onReset}
          title="Reset view"
          aria-label="Reset view"
          className="focus-ring flex min-h-11 min-w-0 items-center justify-center gap-2 rounded px-2.5 py-2 text-[11px] text-ink-muted transition-colors hover:bg-surface-900 hover:text-ink-main md:justify-start md:text-left md:text-[12px]"
        >
          <RotateCcw className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="min-w-0 break-words">Reset view</span>
        </button>
        <button
          type="button"
          onClick={onFullscreen}
          title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          aria-pressed={isFullscreen}
          disabled={fullscreenPending}
          className="focus-ring flex min-h-11 min-w-0 items-center justify-center gap-2 rounded px-2.5 py-2 text-[11px] text-ink-muted transition-colors hover:bg-surface-900 hover:text-ink-main disabled:cursor-wait disabled:opacity-50 md:justify-start md:text-left md:text-[12px]"
        >
          {isFullscreen ? <Minimize2 className="h-4 w-4 shrink-0" aria-hidden="true" /> : <Maximize2 className="h-4 w-4 shrink-0" aria-hidden="true" />}
          <span className="min-w-0 break-words">{isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}</span>
        </button>
      </div>
    </div>
  );
}
