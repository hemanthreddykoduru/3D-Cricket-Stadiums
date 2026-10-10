'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PUBLIC_STADIUMS } from '@/data/stadiums';
import { IndiaMap } from '@/components/map/IndiaMap';
import { MapPin, ArrowRight, Filter } from 'lucide-react';
import type { Stadium } from '@/types/stadium';

export default function MapPage() {
  const [selected, setSelected] = useState<Stadium | null>(null);
  const [stateFilter, setStateFilter] = useState<string>('All');

  const states = ['All', ...Array.from(new Set(PUBLIC_STADIUMS.map((s) => s.state))).sort()];
  const filtered = stateFilter === 'All' ? PUBLIC_STADIUMS : PUBLIC_STADIUMS.filter((s) => s.state === stateFilter);

  return (
    <div className="safe-area-page mx-auto max-w-[1600px] py-14 md:py-20">
      <div className="mb-10 grid gap-6 border-b border-line pb-8 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <div className="text-[14px] font-medium text-accent">Explore by location</div>
          <h1 className="mt-2 max-w-full font-display text-[32px] font-bold tracking-tight text-ink-main md:text-[44px]">
            Stadiums across India
          </h1>
          <p className="mt-3 max-w-xl text-[16px] leading-relaxed text-ink-muted">
            Select a marker or choose a venue from the list. Open its profile to see more, including 3D views where available.
          </p>
        </div>
        <label className="flex min-w-0 flex-col gap-2 md:w-64">
          <span className="flex items-center gap-2 text-[13px] font-medium text-ink-main">
            <Filter className="h-3.5 w-3.5 text-ink-dim" aria-hidden="true" />
            State
          </span>
          <select
            aria-label="Filter venues by state"
            value={stateFilter}
            onChange={(e) => { setStateFilter(e.target.value); setSelected(null); }}
            className="focus-ring min-h-11 w-full min-w-0 max-w-full rounded-md border border-line-strong bg-surface-950 px-3 py-2 text-[16px] text-ink-main"
          >
            {states.map((s) => <option key={s} value={s}>{s === 'All' ? 'All states' : s}</option>)}
          </select>
        </label>
      </div>

      <div className="grid gap-8 md:grid-cols-[1.2fr_1fr] md:gap-10">
        <div className="min-w-0 rounded-lg border border-line bg-surface-900 p-4 sm:p-6">
          <IndiaMap stadiums={filtered} onSelect={setSelected} selected={selected} />
          <p className="mt-4 border-t border-line pt-4 text-center text-[13px] text-ink-muted">Schematic location view · Not a boundary map</p>
        </div>

        <div className="min-w-0 flex flex-col gap-3">
          {selected ? (
            <StadiumPreview stadium={selected} onClear={() => setSelected(null)} />
          ) : (
            <StadiumList stadiums={filtered} onSelect={setSelected} />
          )}
        </div>
      </div>
    </div>
  );
}

function StadiumPreview({ stadium, onClear }: { stadium: Stadium; onClear: () => void }) {
  return (
    <div className="rounded-lg border border-line bg-surface-950 p-6 shadow-[0_6px_24px_rgba(36,95,158,0.05)]" aria-live="polite">
      <div className="text-[14px] font-medium text-accent">Selected venue</div>
      <h2 className="mt-2 break-words font-display text-[26px] font-semibold tracking-tight text-ink-main">{stadium.name}</h2>
      <div className="mt-2 flex min-w-0 items-start gap-1.5 text-[14px] text-ink-muted">
        <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span className="break-words">{stadium.city}, {stadium.state}</span>
      </div>
      {stadium.capacity !== undefined && (
        <div className="mt-4 text-[14px] text-ink-muted">
          Capacity: <span className="text-ink-main">{stadium.capacity.toLocaleString('en-IN')}</span>
        </div>
      )}
      <p className="mt-4 text-[15px] leading-relaxed text-ink-muted">{stadium.description}</p>
      <div className="mt-6 flex flex-wrap gap-2">
        <Link
          href={`/stadiums/${stadium.slug}`}
          className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-md bg-accent px-4 py-2 text-[14px] font-semibold text-on-accent hover:bg-accent-hover"
        >
          {stadium.modelStatus === 'available' ? 'Explore in 3D' : 'View venue profile'} <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
        <button
          onClick={onClear}
          className="focus-ring min-h-11 rounded-md border border-line-strong px-4 py-2 text-[14px] text-ink-muted hover:border-accent hover:text-accent"
        >
          Back to venues
        </button>
      </div>
    </div>
  );
}

function StadiumList({ stadiums, onSelect }: { stadiums: Stadium[]; onSelect: (s: Stadium) => void }) {
  return (
    <>
      <div className="text-[14px] font-medium text-ink-muted" role="status">
        {stadiums.length} stadiums
      </div>
       <div className="max-h-[540px] overflow-x-hidden overflow-y-auto rounded-lg border border-line px-3">
        {stadiums.map((s) => (
          <button
            key={s.id}
            onClick={() => onSelect(s)}
             className="focus-ring flex min-h-11 w-full items-center justify-between gap-4 border-b border-line py-4 text-left transition-colors last:border-b-0 hover:bg-surface-900"
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-9 w-7 shrink-0 items-center justify-center">
                <MapPin className="h-4 w-4 text-accent" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <div className="break-words text-[15px] font-semibold text-ink-main">{s.name}</div>
                <div className="mt-1 break-words text-[13px] text-ink-muted">{s.city}, {s.state}</div>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
          </button>
        ))}
      </div>
    </>
  );
}
