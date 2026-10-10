'use client';

import type { SeatPavilion, SelectedSeat } from '@/types/stadium';

interface Props {
  seat: SelectedSeat;
  pavilion?: Pick<SeatPavilion, 'name' | 'tier'>;
  onExit?: () => void;
}

export function SeatView({ seat, pavilion, onExit }: Props) {
  return (
    <div className="w-full min-w-0 max-w-full space-y-2 overflow-x-hidden rounded-md border border-line bg-surface-900 p-3 text-[12px] text-ink-main">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-muted">Selected seat</p>
      <p className="min-w-0 break-words font-medium [overflow-wrap:anywhere]">
        {pavilion?.name ?? seat.standName}
      </p>
      <dl className="grid min-w-0 grid-cols-2 gap-2">
        <div className="min-w-0"><dt className="text-[10px] text-ink-muted">Row</dt><dd className="font-semibold">{seat.row}</dd></div>
        <div className="min-w-0"><dt className="text-[10px] text-ink-muted">Seat</dt><dd className="font-semibold">{seat.seat}</dd></div>
      </dl>
      <p className="text-[10px] leading-relaxed text-ink-muted">Model-based eye-level view. Sightlines are approximate, not surveyed.</p>
      {onExit && (
        <button
          type="button"
          onClick={onExit}
          className="focus-ring min-h-11 min-w-0 w-full rounded-md border border-line-strong bg-surface-950 px-2 py-2 text-[11px] text-ink-main transition-colors hover:bg-surface-850"
        >
          Return to overview
        </button>
      )}
    </div>
  );
}
