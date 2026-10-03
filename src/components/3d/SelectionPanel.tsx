'use client';

import { useState } from 'react';
import { Layers } from 'lucide-react';
import type { LayerKey } from '@/types/stadium';
import { LayerPanel } from './LayerPanel';

interface Props {
  layers: Record<LayerKey, boolean>;
  onToggleLayer: (key: LayerKey) => void;
}

export function SelectionPanel({ layers, onToggleLayer }: Props) {
  const [mobileLayers, setMobileLayers] = useState(false);

  return (
    <div className="border-t border-white/5 bg-surface-950/70 backdrop-blur-xl md:border-t-0 md:bg-transparent">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-3 md:px-8 md:py-4">
        <div className="flex items-center gap-3 text-[12px] text-ink-muted">
          <div className="hidden h-1 w-1 rounded-full bg-accent md:block" />
          <span className="hidden md:inline">Drag to rotate · Scroll or pinch to zoom · Right-drag to pan</span>
          <span className="md:hidden">Drag to rotate · Pinch to zoom</span>
        </div>
        <button
          onClick={() => setMobileLayers((value) => !value)}
          className="focus-ring flex items-center gap-1.5 rounded-md border border-white/10 bg-surface-800 px-2.5 py-1.5 text-[11px] text-ink-muted md:hidden"
        >
          <Layers className="h-3 w-3" />
          Layers
        </button>
      </div>
      {mobileLayers && (
        <div className="border-t border-white/5 md:hidden">
          <div className="px-4 py-3">
            <LayerPanel layers={layers} onToggle={onToggleLayer} />
          </div>
        </div>
      )}
    </div>
  );
}
