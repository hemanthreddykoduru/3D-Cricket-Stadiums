'use client';

import { useState } from 'react';
import Link from 'next/link';
import { STADIUMS } from '@/data/stadiums';
import { IndiaMap } from '@/components/map/IndiaMap';
import { MapPin, ArrowRight, Filter } from 'lucide-react';
import type { Stadium } from '@/types/stadium';

export default function MapPage() {
  const [selected, setSelected] = useState<Stadium | null>(null);
  const [stateFilter, setStateFilter] = useState<string>('All');

  const states = ['All', ...Array.from(new Set(STADIUMS.map((s) => s.state)))];
  const filtered = stateFilter === 'All' ? STADIUMS : STADIUMS.filter((s) => s.state === stateFilter);

  return (
    <div className="mx-auto max-w-[1600px] px-6 py-14 md:px-10 md:py-20">
      <div className="mb-10 grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <div className="text-[11px] uppercase tracking-[0.22em] text-ink-muted">Interactive map</div>
          <h1 className="mt-2 font-display text-[32px] font-bold tracking-tight text-ink-main md:text-[44px]">
            Stadiums across India
          </h1>
          <p className="mt-3 max-w-xl text-[14px] text-ink-muted">
            Click a marker to preview the stadium and open its 3D experience.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-ink-dim" />
          <select
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
            className="focus-ring rounded-md border border-white/10 bg-surface-800 px-3 py-2 text-[12px] text-ink-main outline-none"
          >
            {states.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-[1.2fr_1fr] md:gap-10">
        <div className="glass overflow-hidden rounded-md border border-white/5 p-6">
          <IndiaMap stadiums={filtered} onSelect={setSelected} selected={selected} />
        </div>

        <div className="flex flex-col gap-3">
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
    <div className="glass animate-fade-in rounded-md border border-accent/20 p-6">
      <div className="text-[10px] uppercase tracking-[0.22em] text-accent">Selected</div>
      <h3 className="mt-2 font-display text-[22px] font-semibold text-ink-main">{stadium.name}</h3>
      <div className="mt-1.5 flex items-center gap-1.5 text-[12px] text-ink-muted">
        <MapPin className="h-3 w-3" />
        {stadium.city}, {stadium.state}
      </div>
      {stadium.capacity && (
        <div className="mt-3 text-[12px] text-ink-muted">
          Capacity: <span className="text-ink-main">{stadium.capacity.toLocaleString('en-IN')}</span>
        </div>
      )}
      <p className="mt-4 text-[13px] leading-relaxed text-ink-muted">{stadium.description}</p>
      <div className="mt-6 flex gap-2">
        <Link
          href={`/stadiums/${stadium.slug}`}
          className="focus-ring inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-[12px] font-semibold text-surface-950 hover:bg-accent-hover"
        >
          Explore 3D <ArrowRight className="h-3.5 w-3.5" />
        </Link>
        <button
          onClick={onClear}
          className="focus-ring rounded-md border border-white/10 px-4 py-2 text-[12px] text-ink-muted hover:text-ink-main"
        >
          Close
        </button>
      </div>
    </div>
  );
}

function StadiumList({ stadiums, onSelect }: { stadiums: Stadium[]; onSelect: (s: Stadium) => void }) {
  return (
    <>
      <div className="text-[10px] uppercase tracking-[0.22em] text-ink-muted">
        {stadiums.length} stadiums
      </div>
      <div className="max-h-[540px] overflow-y-auto">
        {stadiums.map((s) => (
          <button
            key={s.id}
            onClick={() => onSelect(s)}
            className="focus-ring flex w-full items-center justify-between gap-4 border-b border-white/5 py-4 text-left transition-colors hover:bg-surface-900"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-surface-800">
                <MapPin className="h-4 w-4 text-accent" />
              </div>
              <div>
                <div className="text-[13px] font-semibold text-ink-main">{s.name}</div>
                <div className="text-[11px] text-ink-muted">{s.city}, {s.state}</div>
              </div>
            </div>
            <ArrowRight className="h-3.5 w-3.5 text-ink-dim" />
          </button>
        ))}
      </div>
    </>
  );
}
