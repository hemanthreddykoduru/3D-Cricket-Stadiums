'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, MapPin, ArrowRight, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getFeaturedStadiums, searchStadiums } from '@/data/stadiums';

export function SearchModal({ onClose }: { onClose: () => void }) {
  const [q, setQ] = useState('');
  const [idx, setIdx] = useState(0);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const results = useMemo(() => q.trim() ? searchStadiums(q) : getFeaturedStadiums().slice(0, 4), [q]);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    const dialog = dialogRef.current;
    dialog?.showModal();
    document.body.style.overflow = 'hidden';
    inputRef.current?.focus();
    return () => {
      dialog?.close();
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus({ preventScroll: true });
    };
  }, []);
  useEffect(() => { setIdx(0); }, [q]);
  useEffect(() => {
    const active = results[idx];
    if (active) document.getElementById(`search-result-${active.id}`)?.scrollIntoView({ block: 'nearest' });
  }, [idx, results]);

  const open = (slug: string) => {
    router.push(`/stadiums/${slug}`);
    onClose();
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
      return;
    }
    if (!results.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIdx((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && results[idx]) {
      e.preventDefault();
      open(results[idx].slug);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="search-dialog-title"
      className="search-dialog fixed inset-x-0 m-0 mx-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-1rem)] overflow-x-hidden overflow-y-auto overscroll-contain rounded-2xl border border-line bg-surface-950 p-0 text-ink-main shadow-[0_12px_40px_rgba(24,45,65,0.14)]"
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
        <div className="flex min-w-0 items-center gap-3 border-b border-line-strong bg-surface-950 px-4 focus-within:border-accent sm:px-5">
          <Search className="h-5 w-5 shrink-0 text-accent" aria-hidden="true" />
          <h2 id="search-dialog-title" className="sr-only">Search stadiums</h2>
          <input
            ref={inputRef}
            id="stadium-search"
            role="combobox"
            aria-expanded="true"
            aria-autocomplete="list"
            autoComplete="off"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKey}
            aria-label="Search stadiums, cities or states"
            aria-controls="stadium-search-results"
            aria-activedescendant={results[idx] ? `search-result-${results[idx].id}` : undefined}
            placeholder="Stadium, city, or state…"
            className="focus-ring min-w-0 flex-1 bg-transparent py-5 text-[16px] text-ink-main placeholder:text-ink-dim"
          />
          <kbd className="hidden rounded border border-line bg-surface-900 px-1.5 py-0.5 text-[10px] text-ink-dim md:inline">
            ESC
          </kbd>
          <button
            type="button"
            onClick={onClose}
            className="focus-ring flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-surface-900 hover:text-ink-main"
            aria-label="Close search"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {!q.trim() && <p className="break-words px-5 pb-2 pt-4 text-[11px] uppercase tracking-[0.16em] text-ink-muted">Start with a featured ground</p>}
          {q.trim() !== '' && results.length === 0 && (
            <div className="px-5 py-10 text-center">
              <p className="break-words text-[15px] font-medium">No stadiums match &ldquo;{q}&rdquo;</p>
              <p className="mt-2 text-[13px] text-ink-muted">Try another name, city, or state.</p>
              <button type="button" onClick={() => { setQ(''); inputRef.current?.focus(); }} className="focus-ring mt-4 min-h-11 rounded-lg border border-line-strong bg-surface-950 px-4 text-[13px] text-accent hover:bg-surface-900">Clear search</button>
            </div>
          )}
        <div id="stadium-search-results" role="listbox" aria-label="Stadium search results" className="max-h-[48dvh] overflow-y-auto">
          {results.map((s, i) => (
            <button
              key={s.id}
              id={`search-result-${s.id}`}
              role="option"
              aria-selected={i === idx}
              tabIndex={-1}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => open(s.slug)}
              onMouseEnter={() => setIdx(i)}
              className={`focus-ring flex min-h-11 w-full items-center justify-between gap-3 border-b border-line px-4 py-3.5 text-left transition-colors sm:px-5 ${
                i === idx ? 'bg-surface-850' : 'hover:bg-surface-900'
              }`}
            >
              <div className="flex min-w-0 items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-line bg-surface-950">
                  <MapPin className="h-4 w-4 text-accent" />
                </div>
                <div className="min-w-0">
                  <div className="break-words text-[13px] font-semibold text-ink-main">{s.name}</div>
                  <div className="mt-0.5 break-words text-[11px] text-ink-muted">
                    {s.city}, {s.state}
                    {s.capacity ? ` · ${s.capacity.toLocaleString('en-IN')} seats` : ''}
                  </div>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="hidden whitespace-nowrap rounded-full border border-line bg-surface-950 px-2 py-1 text-[10px] text-ink-muted sm:inline">
                  {s.modelStatus === 'available' ? '3D ready' : 'Venue profile'}
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-ink-dim" />
              </div>
            </button>
          ))}
        </div>

        <div className="safe-area-bottom flex flex-col items-start gap-2 border-t border-line bg-surface-900 px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-ink-dim">
            <span><kbd className="rounded border border-line bg-surface-950 px-1">↑↓</kbd> Navigate</span>
            <span><kbd className="rounded border border-line bg-surface-950 px-1">↵</kbd> Open</span>
          </div>
          <span role="status" className="text-[10px] uppercase tracking-wider text-ink-muted">
            {results.length} result{results.length === 1 ? '' : 's'}
          </span>
        </div>
    </dialog>
  );
}
