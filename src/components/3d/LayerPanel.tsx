'use client';

import { Layers, Box, Armchair, DoorClosed, UtensilsCrossed, Bath, Car, Accessibility } from 'lucide-react';
import type { LayerKey } from '@/types/stadium';

interface Props {
  layers: Record<LayerKey, boolean>;
  onToggle: (k: LayerKey) => void;
}

const LAYERS: Array<{ key: LayerKey; label: string; icon: any }> = [
  { key: 'stadium', label: 'Stadium', icon: Box },
  { key: 'stands', label: 'Stands', icon: Layers },
  { key: 'seats', label: 'Seats', icon: Armchair },
  { key: 'environment', label: 'Environment', icon: Box },
  { key: 'roads', label: 'Roads', icon: Box },
  { key: 'buildings', label: 'Buildings', icon: Box },
  { key: 'trees', label: 'Trees', icon: Box },
  { key: 'parking', label: 'Parking', icon: Car },
  { key: 'gates', label: 'Gates', icon: DoorClosed },
  { key: 'food', label: 'Food & Beverage', icon: UtensilsCrossed },
  { key: 'restrooms', label: 'Restrooms', icon: Bath },
  { key: 'accessibility', label: 'Accessibility', icon: Accessibility },
];

export function LayerPanel({ layers, onToggle }: Props) {
  return (
    <div className="glass flex flex-col gap-1 rounded-md p-1.5 md:w-48">
      <div className="px-2.5 py-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-ink-muted">
        Layers
      </div>
      {LAYERS.map((l) => {
        const Icon = l.icon;
        const active = layers[l.key];
        return (
          <button
            key={l.key}
            onClick={() => onToggle(l.key)}
            className={`focus-ring flex items-center gap-2.5 rounded px-2.5 py-1.5 text-[12px] transition-colors ${
              active ? 'text-ink-main' : 'text-ink-dim hover:text-ink-muted'
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
