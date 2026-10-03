'use client';

import { Layers, Box, Armchair, DoorClosed, UtensilsCrossed, Bath, Car, Accessibility } from 'lucide-react';
import type { LayerKey } from '@/types/stadium';

interface Props {
  layers: Record<LayerKey, boolean>;
  onToggle: (k: LayerKey) => void;
}

const LAYERS: Array<{ key: LayerKey; label: string; icon: any; supported?: boolean }> = [
  { key: 'stadium', label: 'Stadium', icon: Box },
   { key: 'stands', label: 'Stands', icon: Layers, supported: false },
   { key: 'seats', label: 'Seats', icon: Armchair, supported: false },
  { key: 'environment', label: 'Environment', icon: Box },
  { key: 'roads', label: 'Roads', icon: Box },
   { key: 'buildings', label: 'Buildings', icon: Box, supported: false },
   { key: 'trees', label: 'Trees', icon: Box, supported: false },
  { key: 'parking', label: 'Parking', icon: Car },
   { key: 'gates', label: 'Gates', icon: DoorClosed, supported: false },
   { key: 'food', label: 'Food & Beverage', icon: UtensilsCrossed, supported: false },
   { key: 'restrooms', label: 'Restrooms', icon: Bath, supported: false },
   { key: 'accessibility', label: 'Accessibility', icon: Accessibility, supported: false },
];

export function LayerPanel({ layers, onToggle }: Props) {
  return (
    <div className="glass flex max-h-[min(70vh,520px)] flex-col gap-1 overflow-y-auto rounded-md p-1.5 md:w-48">
      <div className="px-2.5 py-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-ink-muted">
        Layers
      </div>
      {LAYERS.map((l) => {
        const Icon = l.icon;
        const active = layers[l.key];
        const disabled = l.supported === false;
        return (
          <button
            key={l.key}
            onClick={() => onToggle(l.key)}
            disabled={disabled}
            aria-label={disabled ? `${l.label}: unavailable for this model` : `Toggle ${l.label}`}
            title={disabled ? 'Unavailable for this model' : `Toggle ${l.label}`}
            className={`focus-ring flex items-center gap-2.5 rounded px-2.5 py-1.5 text-[12px] transition-colors ${
              disabled ? 'cursor-not-allowed text-ink-dim/50' : active ? 'text-ink-main' : 'text-ink-dim hover:text-ink-muted'
            }`}
          >
            <div
              className={`flex h-4 w-4 items-center justify-center rounded-sm border ${
                active ? 'border-accent bg-accent/15' : 'border-white/15'
              }`}
            >
              {active && <div className="h-2 w-2 rounded-[2px] bg-accent" />}
            </div>
            <Icon className="h-3.5 w-3.5" />
            <span className="flex-1 text-left">{l.label}</span>
          </button>
        );
      })}
    </div>
  );
}
