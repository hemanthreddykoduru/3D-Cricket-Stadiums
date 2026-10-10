'use client';

import { useEffect, useId, useState, type ReactNode } from 'react';
import { Armchair, Layers, X } from 'lucide-react';
import type { LayerKey } from '@/types/stadium';
import { LayerPanel } from './LayerPanel';

interface Props {
  layers: Record<LayerKey, boolean>;
  onToggleLayer: (key: LayerKey) => void;
  cameraControls: ReactNode;
  seatControls?: ReactNode;
  seatMode?: boolean;
  seatRequestId?: number;
}

export function SelectionPanel({ layers, onToggleLayer, cameraControls, seatControls, seatMode = false, seatRequestId }: Props) {
  const [mobilePanel, setMobilePanel] = useState<'layers' | 'seats' | null>(null);
  const panelId = useId();
  useEffect(() => {
    if (seatMode) setMobilePanel(null);
  }, [seatMode, seatRequestId]);

  return (
    <>
      <div className="pointer-events-auto absolute inset-x-3 bottom-[calc(4.25rem_+_env(safe-area-inset-bottom))] z-20 min-w-0 max-w-[calc(100%_-_1.5rem)] md:inset-x-auto md:bottom-auto md:right-6 md:top-1/2 md:-translate-y-1/2">
        <div className={mobilePanel ? 'hidden md:block' : undefined}>{cameraControls}</div>
        <div id={`${panelId}-layers`} hidden={mobilePanel !== 'layers'} className="max-h-[min(55vh,calc(100dvh_-_9rem))] w-full min-w-0 max-w-full overflow-x-hidden overflow-y-auto overscroll-contain md:hidden">
          <LayerPanel layers={layers} onToggle={onToggleLayer} />
        </div>
        <div id={`${panelId}-seats`} hidden={mobilePanel !== 'seats'} className="max-h-[min(55vh,calc(100dvh_-_9rem))] w-full min-w-0 max-w-full overflow-x-hidden overflow-y-auto overscroll-contain md:hidden">
          {seatControls}
        </div>
      </div>

      <div className="pointer-events-auto absolute inset-x-0 bottom-0 z-20 border-t border-line bg-surface-950/95 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur-xl md:pb-0">
        <div className="mx-auto flex min-h-14 max-w-[1600px] items-center justify-between gap-3 px-3 pt-2 md:px-8 md:py-4">
          <p className="min-w-0 flex-1 break-words text-[11px] leading-relaxed text-ink-muted md:flex-none md:text-[12px]">
            {seatMode ? <>
              <span className="hidden md:inline">Drag to look around · Arrow keys when focused · Seat position stays fixed</span>
              <span className="md:hidden">Drag to look around<br />Seat position fixed</span>
            </> : <>
              <span className="hidden md:inline">Drag to rotate · Scroll to zoom · Right-drag to pan</span>
              <span className="md:hidden">Drag to rotate<br />Pinch to zoom · Two fingers to pan</span>
            </>}
          </p>
          <div className="flex shrink-0 gap-2 md:hidden">
            {seatControls && <button
              type="button"
              onClick={() => setMobilePanel((value) => value === 'seats' ? null : 'seats')}
              aria-expanded={mobilePanel === 'seats'}
              aria-controls={`${panelId}-seats`}
              className="focus-ring flex min-h-11 shrink-0 items-center gap-1.5 rounded-md border border-line-strong bg-surface-950 px-3 py-2 text-[11px] text-ink-main hover:bg-surface-900"
            >
              <Armchair className="h-3.5 w-3.5" aria-hidden="true" />
              Seats
            </button>}
            <button
              type="button"
              onClick={() => setMobilePanel((value) => value === 'layers' ? null : 'layers')}
              aria-expanded={mobilePanel === 'layers'}
              aria-controls={`${panelId}-layers`}
              className="focus-ring flex min-h-11 shrink-0 items-center gap-1.5 rounded-md border border-line-strong bg-surface-950 px-3 py-2 text-[11px] text-ink-main hover:bg-surface-900"
            >
              {mobilePanel === 'layers' ? <X className="h-3.5 w-3.5" aria-hidden="true" /> : <Layers className="h-3.5 w-3.5" aria-hidden="true" />}
              Layers
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
