'use client';

import { Compass } from 'lucide-react';

interface Props {
  label?: string;
  progress?: number; // 0-100
}

export function LoadingScreen({ label = 'Loading stadium', progress }: Props) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-surface-950">
      <div className="flex flex-col items-center gap-6">
        <div className="flex items-center gap-3">
          <Compass className="h-6 w-6 text-accent" strokeWidth={2.2} />
          <span className="font-display text-[13px] font-bold uppercase tracking-[0.22em] text-ink-main">
            Stadium3D India
          </span>
        </div>

        <div className="flex flex-col items-center gap-3">
          <div className="text-[11px] uppercase tracking-[0.22em] text-ink-muted">
            {label}
          </div>
          <div className="h-[2px] w-56 overflow-hidden rounded-full bg-surface-700">
            <div
              className="h-full rounded-full bg-gradient-to-r from-accent-dim via-accent to-accent-hover transition-[width] duration-300"
              style={{ width: `${progress ?? 40}%` }}
            />
          </div>
          {typeof progress === 'number' && (
            <div className="font-mono text-[10px] tracking-widest text-ink-dim">
              {Math.round(progress)}%
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
