'use client';

import { useEffect, useId, useMemo, useState } from 'react';
import type { SeatMap, SelectedSeat } from '@/types/stadium';
import { SeatView } from './SeatView';

interface Props {
  seatMap: SeatMap | null;
  selectedSeat: SelectedSeat | null;
  seatMode: boolean;
  onSelect: (seat: SelectedSeat) => void;
  onExit: () => void;
}

const EMPTY_CHOICE = { pavilionId: '', rowNumber: '', seatId: '' };
const SELECT_CLASS = 'focus-ring min-h-11 w-full min-w-0 max-w-full truncate rounded-md border border-line-strong bg-surface-950 px-2 py-2 text-[12px] text-ink-main disabled:cursor-not-allowed disabled:border-line disabled:text-ink-muted disabled:opacity-60';

export function SeatSelector({ seatMap, selectedSeat, seatMode, onSelect, onExit }: Props) {
  const id = useId();
  const [draft, setDraft] = useState({
    map: seatMap,
    sourceSeat: null as SelectedSeat | null,
    ...EMPTY_CHOICE,
  });

  const selectedLocation = useMemo(() => {
    if (!seatMap || !selectedSeat) return null;
    for (const pavilion of seatMap.pavilions) {
      for (const row of pavilion.rows) {
        const seat = row.seats.find((candidate) => candidate.id === selectedSeat.id);
        if (seat) return { pavilion, row, seat };
      }
    }
    return null;
  }, [seatMap, selectedSeat]);

  useEffect(() => {
    setDraft((current) => {
      const mapChanged = current.map !== seatMap;
      const selectionChanged = current.sourceSeat !== selectedSeat;
      // A replacement map cannot reuse a retained selection merely because its IDs match.
      if (selectedLocation && (selectionChanged || !mapChanged || selectedLocation.seat === selectedSeat)) {
        return {
          map: seatMap,
          sourceSeat: selectedSeat,
          pavilionId: selectedLocation.pavilion.id,
          rowNumber: String(selectedLocation.row.number),
          seatId: selectedLocation.seat.id,
        };
      }
      if (mapChanged || (selectionChanged && selectedSeat)) {
        return { map: seatMap, sourceSeat: selectedSeat, ...EMPTY_CHOICE };
      }
      return current.sourceSeat === selectedSeat ? current : { ...current, sourceSeat: selectedSeat };
    });
  }, [seatMap, selectedSeat, selectedLocation]);

  const pavilions = seatMap?.pavilions.filter((pavilion) => pavilion.rows.some((row) => row.seats.length > 0)) ?? [];
  // Validate against the current map on every render, including before the sync effect runs.
  const pavilion = draft.map === seatMap ? pavilions.find((item) => item.id === draft.pavilionId) : undefined;
  const rows = pavilion?.rows.filter((row) => row.seats.length > 0) ?? [];
  const row = rows.find((item) => String(item.number) === draft.rowNumber);
  const draftSeat = row?.seats.find((seat) => seat.id === draft.seatId);

  return (
    <section className="glass w-full min-w-0 max-w-full shrink-0 space-y-3 overflow-x-hidden rounded-lg p-3" aria-labelledby={`${id}-title`} aria-describedby={`${id}-note`}>
      <h2 id={`${id}-title`} className="text-sm font-semibold text-ink-main">View from your seat</h2>

      {!seatMap ? (
        <p role="status" className="text-[12px] leading-relaxed text-ink-muted">Reading seat positions…</p>
      ) : pavilions.length === 0 ? (
        <p role="status" className="text-[12px] leading-relaxed text-ink-muted">Seat views are unavailable for this model.</p>
      ) : null}

      <div className="space-y-1.5">
        <label htmlFor={`${id}-pavilion`} className="block text-[11px] font-medium text-ink-muted">Pavilion</label>
        <select
          id={`${id}-pavilion`}
          className={SELECT_CLASS}
          value={pavilion?.id ?? ''}
          disabled={pavilions.length === 0}
          onChange={(event) => {
            const nextPavilion = pavilions.find((item) => item.id === event.target.value);
            setDraft((current) => ({ ...current, map: seatMap, ...EMPTY_CHOICE, pavilionId: nextPavilion?.id ?? '' }));
            if (seatMode) onExit();
          }}
        >
          <option value="">Choose pavilion</option>
          {pavilions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
      </div>

      <div className="grid min-w-0 grid-cols-2 gap-2">
        <div className="min-w-0 space-y-1.5">
          <label htmlFor={`${id}-row`} className="block text-[11px] font-medium text-ink-muted">Row</label>
          <select
            id={`${id}-row`}
            className={SELECT_CLASS}
            value={row ? String(row.number) : ''}
            disabled={!pavilion}
            onChange={(event) => {
              const nextRow = rows.find((item) => String(item.number) === event.target.value);
              setDraft((current) => ({ ...current, rowNumber: nextRow ? String(nextRow.number) : '', seatId: '' }));
              if (seatMode) onExit();
            }}
          >
            <option value="">Choose row</option>
            {rows.map((item) => <option key={item.number} value={String(item.number)}>{item.number}</option>)}
          </select>
        </div>

        <div className="min-w-0 space-y-1.5">
          <label htmlFor={`${id}-seat`} className="block text-[11px] font-medium text-ink-muted">Seat number</label>
          <select
            id={`${id}-seat`}
            className={SELECT_CLASS}
            value={draftSeat?.id ?? ''}
            disabled={!row}
            onChange={(event) => {
              const seat = row?.seats.find((item) => item.id === event.target.value);
              setDraft((current) => ({ ...current, seatId: seat?.id ?? '' }));
              if (seat) onSelect(seat);
              else if (seatMode) onExit();
            }}
          >
            <option value="">Choose seat</option>
            {row?.seats.map((seat) => <option key={seat.id} value={seat.id}>{seat.seat}</option>)}
          </select>
        </div>
      </div>

      <button
        type="button"
        disabled={!draftSeat}
        onClick={() => { if (draftSeat) onSelect(draftSeat); }}
        className="focus-ring min-h-11 w-full rounded-md bg-accent px-3 py-2 text-[12px] font-medium text-on-accent transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
      >
        View from seat
      </button>

      {seatMode && selectedSeat && draftSeat?.id === selectedSeat.id && pavilion && (
        <SeatView seat={draftSeat} pavilion={pavilion} onExit={onExit} />
      )}

      <p id={`${id}-note`} className="border-t border-line pt-2 text-[10px] leading-relaxed text-ink-muted">
        Model numbering — not official ticket seats. Pavilion labels are model-derived.
      </p>
    </section>
  );
}
