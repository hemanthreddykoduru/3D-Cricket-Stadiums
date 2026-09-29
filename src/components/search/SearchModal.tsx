'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, MapPin, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { searchStadiums } from '@/data/stadiums';

export function SearchModal({ onClose }: { onClose: () => void }) {
  const [q, setQ] = useState('');
  const [idx, setIdx] = useState(0);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => searchStadiums(q), [q]);

  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => { setIdx(0); }, [q]);

  const open = (slug: string) => {
    router.push(`/stadiums/${slug}`);
    onClose();
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIdx((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && results[idx]) {
      open(results[idx].slug);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[200] bg-surface-950/80 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="glass mx-auto mt-[12vh] w-[min(640px,92vw)] overflow-hidden rounded-lg border border-white/10 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-white/5 px-5">
          <Search className="h-4 w-4 text-ink-muted" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKey}
            placeholder="Search stadiums, cities or states…"
            className="w-full bg-transparent py-4 text-[14px] text-ink-main outline-none placeholder:text-ink-dim"
          />
          <kbd className="hidden rounded border border-white/10 bg-surface-800 px-1.5 py-0.5 text-[10px] text-ink-dim md:inline">
            ESC
          </kbd>
        </div>

        <div className="max-h-[52vh] overflow-y-auto">
          {q.trim() === '' && (
            <div className="px-5 py-8 text-center">
              <p className="text-[12px] uppercase tracking-[0.22em] text-ink-muted">
                Try typing "Wankhede", "Mumbai", or "Eden"
              </p>
            </div>
          )}
          {q.trim() !== '' && results.length === 0 && (
            <div className="px-5 py-10 text-center">
              <p className="text-[13px] text-ink-muted">No stadiums match "{q}"</p>
            </div>
          )}
          {results.map((s, i) => (
            <button
              key={s.id}
              onClick={() => open(s.slug)}
              onMouseEnter={() => setIdx(i)}
              className={`focus-ring flex w-full items-center justify-between gap-4 border-b border-white/5 px-5 py-3.5 text-left transition-colors ${
                i === idx ? 'bg-surface-800/80' : 'hover:bg-surface-800/40'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-md bg-surface-700">
                  <MapPin className="h-4 w-4 text-accent" />
                </div>
                <div>
                  <div className="text-[13px] font-semibold text-ink-main">{s.name}</div>
                  <div className="mt-0.5 text-[11px] text-ink-muted">
                    {s.city}, {s.state}
                    {s.capacity ? ` · ${s.capacity.toLocaleString('en-IN')} seats` : ''}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-sm border border-white/10 bg-surface-700 px-2 py-0.5 text-[9px] uppercase tracking-wider text-ink-muted">
                  {s.modelStatus === 'available' ? '3D Model' : 'Coming Soon'}
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-ink-dim" />
              </div>
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-white/5 bg-surface-900/80 px-5 py-2.5">
          <div className="flex items-center gap-3 text-[10px] text-ink-dim">
            <span><kbd className="rounded border border-white/10 bg-surface-800 px-1">↑↓</kbd> Navigate</span>
            <span><kbd className="rounded border border-white/10 bg-surface-800 px-1">↵</kbd> Open</span>
          </div>
          <span className="text-[10px] uppercase tracking-wider text-ink-dim">
            {results.length} result{results.length === 1 ? '' : 's'}
          </span>
        </div>
      </div>
    </div>
  );
}
