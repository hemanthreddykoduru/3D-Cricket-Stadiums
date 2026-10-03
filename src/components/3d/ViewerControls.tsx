'use client';

import { Maximize2, Minimize2, RotateCcw, Eye, Flag, Mountain, Building2 } from 'lucide-react';
import type { CameraPreset } from '@/types/stadium';

interface Props {
  onPreset: (p: CameraPreset) => void;
  onReset: () => void;
  current: CameraPreset;
  onFullscreen: () => void;
  isFullscreen: boolean;
}

const PRESETS: Array<{ id: CameraPreset; label: string; icon: any }> = [
  { id: 'overview', label: 'Reset', icon: Eye },
  { id: 'top', label: 'Top View', icon: Mountain },
  { id: 'pitch', label: 'Pitch View', icon: Flag },
  { id: 'stand', label: 'Stand View', icon: Building2 },
];

export function ViewerControls({ onPreset, onReset, current, onFullscreen, isFullscreen }: Props) {
  return (
    <div className="glass flex flex-col gap-1 rounded-md p-1.5 md:w-12">
      {PRESETS.map((p) => {
        const Icon = p.icon;
        const active = current === p.id;
        return (
          <button
            key={p.id}
            onClick={() => onPreset(p.id)}
            title={p.label}
            aria-label={p.label}
            className={`focus-ring group relative flex h-10 w-10 items-center justify-center rounded transition-colors ${
              active ? 'bg-accent text-surface-950' : 'text-ink-muted hover:bg-surface-700 hover:text-ink-main'
            }`}
          >
            <Icon className="h-4 w-4" />
            <span className="pointer-events-none absolute right-full mr-2 hidden whitespace-nowrap rounded bg-surface-950 px-2 py-1 text-[11px] text-ink-main shadow-xl md:group-hover:block">
              {p.label}
            </span>
          </button>
        );
      })}
      <div className="my-1 h-[1px] bg-white/5" />
      <button
         onClick={onReset}
        title="Reset"
        aria-label="Reset camera"
        className="focus-ring flex h-10 w-10 items-center justify-center rounded text-ink-muted transition-colors hover:bg-surface-700 hover:text-ink-main"
      >
        <RotateCcw className="h-4 w-4" />
      </button>
      <button
        onClick={onFullscreen}
        title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
        aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
        className="focus-ring flex h-10 w-10 items-center justify-center rounded text-ink-muted transition-colors hover:bg-surface-700 hover:text-ink-main"
      >
        {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
      </button>
    </div>
  );
}
