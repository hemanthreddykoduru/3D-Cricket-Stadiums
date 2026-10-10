'use client';

import { useMemo, useState } from 'react';
import { ChevronDown, MapPin, Search, SlidersHorizontal, X } from 'lucide-react';
import { PUBLIC_STADIUMS, filterStadiums, type AvailabilityFilter } from '@/data/stadiums';
import { StadiumCard } from './StadiumCard';

const AVAILABILITY_FILTERS: Array<{ id: AvailabilityFilter; label: string }> = [
  { id: 'all', label: 'All venues' },
  { id: 'available', label: '3D ready' },
  { id: 'coming-soon', label: 'Venue profiles' },
];

export function StadiumDirectory() {
  const [query, setQuery] = useState('');
  const [state, setState] = useState('all');
  const [availability, setAvailability] = useState<AvailabilityFilter>('all');

  const states = useMemo(
    () => Array.from(new Set(PUBLIC_STADIUMS.map((stadium) => stadium.state))).sort(),
    [],
  );

  const filtered = useMemo(() => filterStadiums(query, state, availability), [availability, query, state]);

  const availableCount = PUBLIC_STADIUMS.filter((stadium) => stadium.modelStatus === 'available').length;
  const stateCount = new Set(PUBLIC_STADIUMS.map((stadium) => stadium.state)).size;
  const hasFilters = Boolean(query.trim()) || state !== 'all' || availability !== 'all';

  const resetFilters = () => {
    setQuery('');
    setState('all');
    setAvailability('all');
  };

  return (
    <>
      <header className="border-b border-line pb-8 md:pb-10">
        <div className="flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
          <div className="min-w-0">
            <div className="text-[14px] font-medium text-accent">
              Stadium directory
            </div>
            <h1 className="mt-3 max-w-2xl font-display text-[36px] font-bold leading-[1.02] tracking-tight text-ink-main md:text-[56px]">
              Choose the ground. See the view.
            </h1>
            <p className="mt-4 max-w-xl text-[16px] leading-relaxed text-ink-muted">
              Browse {PUBLIC_STADIUMS.length} Indian cricket venues by location, 3D availability, or the stadium you already have in mind.
            </p>
          </div>
          <div className="grid min-w-0 grid-cols-3 divide-x divide-line xl:min-w-[330px]">
            <DirectoryStat value={String(PUBLIC_STADIUMS.length)} label="venues" />
            <DirectoryStat value={String(stateCount)} label="states" />
            <DirectoryStat value={String(availableCount)} label="3D ready" />
          </div>
        </div>
      </header>

      <section aria-label="Filter stadiums" className="mt-8 rounded-lg border border-line bg-surface-900 p-4 sm:p-5">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(14rem,auto)]">
          <div className="min-w-0">
            <label htmlFor="directory-search" className="mb-2 block text-[13px] font-medium text-ink-main">Search by stadium, city, or state</label>
            <div className="flex min-h-11 min-w-0 items-center gap-3 rounded-md border border-line-strong bg-surface-950 px-3.5 text-ink-muted focus-within:border-accent focus-within:ring-1 focus-within:ring-accent">
              <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
              <input
                id="directory-search"
                aria-label="Search by stadium, city, or state"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Stadium, city, or state"
                className="min-h-11 min-w-0 flex-1 bg-transparent text-[16px] text-ink-main outline-none placeholder:text-ink-dim"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="focus-ring -mr-1 flex min-h-11 min-w-11 items-center justify-center rounded p-1 text-ink-dim hover:text-ink-main"
                  aria-label="Clear search"
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              )}
            </div>
          </div>

          <div className="min-w-0">
            <label htmlFor="stadium-state" className="mb-2 block text-[13px] font-medium text-ink-main">State</label>
            <div className="relative flex min-h-11 items-center gap-3 rounded-md border border-line-strong bg-surface-950 px-3.5 text-ink-muted focus-within:border-accent focus-within:ring-1 focus-within:ring-accent">
              <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
              <select
                id="stadium-state"
                aria-label="Filter by state"
                value={state}
                onChange={(event) => setState(event.target.value)}
                className="min-h-11 min-w-0 flex-1 appearance-none bg-transparent pr-7 text-[16px] text-ink-main outline-none"
              >
                <option value="all">All states</option>
                {states.map((stateName) => (
                  <option key={stateName} value={stateName}>{stateName}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3.5 h-4 w-4 text-ink-dim" aria-hidden="true" />
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-[13px] font-medium text-ink-main">
            <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
            Availability
          </div>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by model availability">
            {AVAILABILITY_FILTERS.map((filter) => (
              <button
                key={filter.id}
                type="button"
                onClick={() => setAvailability(filter.id)}
                aria-pressed={availability === filter.id}
                className={`focus-ring min-h-11 whitespace-nowrap rounded-md border px-3 text-[13px] font-medium transition-colors ${
                  availability === filter.id
                    ? 'border-accent bg-accent text-on-accent'
                    : 'border-line-strong bg-surface-950 text-ink-muted hover:border-accent hover:text-accent'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-2 text-[14px] text-ink-muted">
        <p aria-live="polite">
          Showing <span className="font-semibold text-ink-main">{filtered.length}</span> of {PUBLIC_STADIUMS.length} venues
        </p>
        {hasFilters && (
          <button
            type="button"
            onClick={resetFilters}
            className="focus-ring flex min-h-11 items-center text-accent hover:text-accent-hover"
          >
            Clear filters
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="mt-5 rounded-lg border border-dashed border-line-strong bg-surface-900 px-5 py-14 text-center sm:px-6 sm:py-16">
          <div className="mx-auto flex h-11 w-11 items-center justify-center text-accent">
            <Search className="h-5 w-5" aria-hidden="true" />
          </div>
          <h2 className="mt-4 font-display text-[18px] font-semibold text-ink-main">
            {hasFilters ? 'No venues match those filters' : 'No venues found'}
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-[15px] leading-relaxed text-ink-muted">
            {hasFilters
              ? 'Try a broader search or reset the filters to browse every public venue.'
              : 'The public directory is currently empty. Check back soon for new venue profiles.'}
          </p>
          {hasFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="focus-ring mt-6 inline-flex min-h-11 items-center justify-center rounded-md bg-accent px-4 text-[14px] font-semibold text-on-accent transition-colors hover:bg-accent-hover"
            >
              Reset filters
            </button>
          )}
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <h2 className="sr-only">Matching stadiums</h2>
          {filtered.map((stadium, index) => (
            <StadiumCard key={stadium.id} stadium={stadium} index={index} />
          ))}
        </div>
      )}
    </>
  );
}

function DirectoryStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="min-w-0 px-4 py-1 first:pl-0">
      <div className="font-display text-[28px] font-semibold tabular-nums text-ink-main">{value}</div>
      <div className="mt-0.5 break-words text-[13px] text-ink-muted">{label}</div>
    </div>
  );
}
