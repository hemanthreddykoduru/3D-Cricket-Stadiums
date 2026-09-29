import { StadiumCard } from '@/components/stadium/StadiumCard';
import { STADIUMS } from '@/data/stadiums';
import { MapPin } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Stadiums',
  description: 'Browse all Indian cricket stadiums available in Stadium3D India.',
};

export default function StadiumsPage() {
  const byState = STADIUMS.reduce<Record<string, typeof STADIUMS>>((acc, s) => {
    (acc[s.state] = acc[s.state] || []).push(s);
    return acc;
  }, {});

  return (
    <div className="mx-auto max-w-[1600px] px-6 py-16 md:px-10 md:py-20">
      <div className="border-b border-white/5 pb-10">
        <div className="text-[11px] uppercase tracking-[0.22em] text-ink-muted">Directory</div>
        <h1 className="mt-2 font-display text-[32px] font-bold tracking-tight text-ink-main md:text-[48px]">
          Indian Cricket Stadiums
        </h1>
        <p className="mt-4 max-w-xl text-[14px] leading-relaxed text-ink-muted">
          {STADIUMS.length} stadiums across {Object.keys(byState).length} states. Verified public metadata. Interactive 3D experiences.
        </p>
      </div>

      {Object.entries(byState).map(([state, stadiums]) => (
        <section key={state} className="py-12">
          <div className="mb-6 flex items-center gap-3">
            <MapPin className="h-4 w-4 text-accent" />
            <h2 className="font-display text-[20px] font-semibold text-ink-main">{state}</h2>
            <span className="text-[12px] text-ink-dim">({stadiums.length})</span>
          </div>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {stadiums.map((s, i) => (
              <StadiumCard key={s.id} stadium={s} index={i} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
