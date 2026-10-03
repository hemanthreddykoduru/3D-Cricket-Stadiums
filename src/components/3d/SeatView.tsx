import type { SelectedSeat } from '@/types/stadium';

export function SeatView({ seat }: { seat: SelectedSeat }) {
  return (
    <div className="rounded-md border border-white/10 bg-surface-900/80 p-4 text-sm text-ink-muted">
      Seat-level coordinates are not available in this GLB yet.
      <span className="ml-1 text-ink-main">{seat.standName} · {seat.blockName}</span>
    </div>
  );
}
