'use client';

import { Armchair, Box } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { LayerKey } from '@/types/stadium';

interface Props {
  layers: Record<LayerKey, boolean>;
  onToggle: (key: LayerKey) => void;
}

const SUPPORTED_LAYERS: Array<{ key: LayerKey; label: string; icon: LucideIcon }> = [
  { key: 'stadium', label: 'Entire stadium', icon: Box },
  { key: 'seats', label: 'Seating', icon: Armchair },
];

export function LayerPanel({ layers, onToggle }: Props) {
  return (
    <div className="glass flex w-full min-w-0 max-w-full shrink-0 flex-col gap-1 overflow-x-hidden rounded-lg p-1.5" role="group" aria-label="Model layers">
      <div className="px-2.5 py-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-ink-muted">
        Model layers
      </div>
      {SUPPORTED_LAYERS.map((layer) => {
        const Icon = layer.icon;
        const active = layers[layer.key];
        return (
          <button
            key={layer.key}
            type="button"
            onClick={() => onToggle(layer.key)}
            aria-label={`Toggle ${layer.label}`}
            aria-pressed={active}
            title={`Toggle ${layer.label}`}
            className={`focus-ring flex min-h-11 min-w-0 items-center gap-2.5 rounded px-2.5 py-2 text-[12px] transition-colors ${
              active ? 'bg-surface-900 text-ink-main' : 'text-ink-muted hover:bg-surface-900 hover:text-ink-main'
            }`}
          >
            <span
              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border ${
                active ? 'border-accent bg-surface-950' : 'border-line-strong bg-surface-950'
              }`}
              aria-hidden="true"
            >
              {active && <span className="h-2 w-2 rounded-[2px] bg-accent" />}
            </span>
            <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span className="min-w-0 flex-1 break-words text-left [overflow-wrap:anywhere]">{layer.label}</span>
          </button>
        );
      })}
      <p className="border-t border-line px-2.5 pb-2 pt-3 text-[10px] leading-relaxed text-ink-muted">
        {layers.stadium
          ? 'Stadium includes the playing field.'
          : 'Turn on Entire stadium to see the selected layers.'}
      </p>
    </div>
  );
}
