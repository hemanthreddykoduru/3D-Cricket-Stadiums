'use client';

import { useState } from 'react';
import { X, ChevronLeft, ChevronRight, ArrowLeft, Layers } from 'lucide-react';
import type { SelectedSeat, Stadium, LayerKey } from '@/types/stadium';
import { LayerPanel } from './LayerPanel';

interface Props {
  stadium: Stadium;
  selectedStandId: string | null;
  selectedSeat: SelectedSeat | null;
  layers: Record<LayerKey, boolean>;
  onToggleLayer: (k: LayerKey) => void;
  onSeatChange: (seat: SelectedSeat) => void;
  onClearStand: () => void;
  onReset: () => void;
}

export function SelectionPanel(props: Props) {
  const { selectedSeat, selectedStandId } = props;
  const [mobileLayers, setMobileLayers] = useState(false);

  const selectedStandName =
    selectedStandId === 'north' ? 'NORTH STAND' :
    selectedStandId === 'south' ? 'SOUTH STAND' :
    selectedStandId === 'east' ? 'EAST STAND' :
    selectedStandId === 'west' ? 'WEST STAND — PAVILION' : null;

  if (selectedSeat) {
    return <SeatViewPanel seat={selectedSeat} onNext={() => advanceSeat(props, 1)} onPrev={() => advanceSeat(props, -1)} onBack={props.onReset} />;
  }

  if (selectedStandId && selectedStandName) {
    return (
      <div className="border-t border-white/5 bg-surface-950/90 backdrop-blur-xl">
        <div className="mx-auto max-w-[1600px] px-4 py-4 md:px-8 md:py-5">
          <div className="flex items-start justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-ink-muted">
                <div className="h-1 w-1 rounded-full bg-accent" />
                Selected Stand
              </div>
              <h3 className="mt-1 font-display text-[22px] font-semibold text-ink-main md:text-[26px]">
                {selectedStandName}
              </h3>
              <div className="mt-2 flex flex-wrap gap-4 text-[11px] text-ink-muted">
                <span>Sections: A1 — A8</span>
                <span>Rows: 1 — 20</span>
                <span>Seats: 1 — 28</span>
              </div>
              <div className="mt-2 inline-flex items-center gap-1.5 rounded-sm border border-white/10 bg-surface-800 px-2 py-0.5 text-[10px] uppercase tracking-wider text-ink-muted">
                Demo seating data
              </div>
            </div>
            <button
              onClick={props.onClearStand}
              className="focus-ring flex h-9 w-9 items-center justify-center rounded-md border border-white/10 text-ink-muted hover:text-ink-main"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-4 max-w-2xl text-[13px] leading-relaxed text-ink-muted">
            Click any seat in the stand to preview the vantage point from that position. Camera will transition to a behind-the-shoulder view toward the pitch.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="border-t border-white/5 bg-surface-950/70 backdrop-blur-xl md:border-t-0 md:bg-transparent">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-3 md:px-8 md:py-4">
        <div className="flex items-center gap-3 text-[12px] text-ink-muted">
          <div className="hidden h-1 w-1 rounded-full bg-accent md:block" />
          <span className="hidden md:inline">Click a stand to explore · Click a seat for view preview</span>
          <span className="md:hidden">Drag to rotate · Pinch to zoom</span>
        </div>
        <button
          onClick={() => setMobileLayers((v) => !v)}
          className="focus-ring flex items-center gap-1.5 rounded-md border border-white/10 bg-surface-800 px-2.5 py-1.5 text-[11px] text-ink-muted md:hidden"
        >
          <Layers className="h-3 w-3" />
          Layers
        </button>
      </div>
      {mobileLayers && (
        <div className="border-t border-white/5 md:hidden">
          <div className="px-4 py-3">
            <LayerPanel layers={props.layers} onToggle={props.onToggleLayer} />
          </div>
        </div>
      )}
    </div>
  );
}

function SeatViewPanel({ seat, onNext, onPrev, onBack }: {
  seat: SelectedSeat;
  onNext: () => void;
  onPrev: () => void;
  onBack: () => void;
}) {
  return (
    <div className="border-t border-white/5 bg-surface-950/90 backdrop-blur-xl">
      <div className="mx-auto max-w-[1600px] px-4 py-4 md:px-8 md:py-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-accent">
              <div className="h-1 w-1 rounded-full bg-accent pulse-glow" />
              Seat View
            </div>
            <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
              <span className="font-display text-[20px] font-semibold text-ink-main md:text-[24px]">
                {seat.standName}
              </span>
              <span className="text-[13px] text-ink-muted">
                Block {seat.blockName} · Row {seat.row} · Seat {seat.seat}
              </span>
            </div>
          </div>
          <button onClick={onBack} className="focus-ring flex items-center gap-2 rounded-md border border-white/10 bg-surface-800 px-3 py-1.5 text-[11px] text-ink-main hover:border-white/20">
            <ArrowLeft className="h-3 w-3" />
            Back
          </button>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat label="Pitch distance" value="Demo" />
          <Stat label="View direction" value="Demo" />
          <Stat label="Elevation" value="Demo" />
          <Stat label="Block" value={seat.blockName} />
        </div>

        <div className="mt-3 flex items-center gap-2">
          <button onClick={onPrev} className="focus-ring flex h-9 w-9 items-center justify-center rounded-md border border-white/10 bg-surface-800 text-ink-main hover:border-accent/40">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button onClick={onNext} className="focus-ring flex h-9 w-9 items-center justify-center rounded-md border border-white/10 bg-surface-800 text-ink-main hover:border-accent/40">
            <ChevronRight className="h-4 w-4" />
          </button>
          <div className="ml-2 text-[11px] text-ink-muted">
            Demo seat view · Navigate between seats
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/5 bg-surface-900/70 px-3 py-2">
      <div className="text-[9px] uppercase tracking-[0.22em] text-ink-dim">{label}</div>
      <div className="mt-0.5 text-[13px] font-medium text-ink-main">{value}</div>
    </div>
  );
}

function advanceSeat({ selectedSeat, onSeatChange }: Props, delta: number) {
  if (!selectedSeat) return;
  const newRow = Math.max(1, Math.min(20, selectedSeat.row + delta));
  onSeatChange({ ...selectedSeat, row: newRow });
}
