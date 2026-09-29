import { notFound } from 'next/navigation';
import { STADIUMS, getStadiumBySlug } from '@/data/stadiums';
import { StadiumViewer } from '@/components/3d/StadiumViewer';
import { StadiumInfo } from '@/components/stadium/StadiumInfo';
import { MapPin, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import type { Metadata } from 'next';

interface Props { params: { slug: string } }

export async function generateStaticParams() {
  return STADIUMS.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const stadium = getStadiumBySlug(params.slug);
  if (!stadium) return {};
  return {
    title: `${stadium.name} 3D`,
    description: `Explore ${stadium.name} in an interactive 3D experience. Discover stands, sections and the view from your seat.`,
    openGraph: {
      title: `${stadium.name} 3D | Stadium3D India`,
      description: `Explore ${stadium.name} in 3D — stands, blocks, rows and seats.`,
    },
  };
}

export default function StadiumDetailPage({ params }: Props) {
  const stadium = getStadiumBySlug(params.slug);
  if (!stadium) notFound();

  return (
    <>
      <section className="border-b border-white/5">
        <div className="mx-auto max-w-[1600px] px-6 py-10 md:px-10 md:py-14">
          <Link
            href="/stadiums"
            className="focus-ring mb-6 inline-flex items-center gap-1.5 text-[12px] text-ink-muted hover:text-ink-main"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> All stadiums
          </Link>
          <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-end">
            <div>
              <div className="text-[11px] uppercase tracking-[0.22em] text-ink-muted">Stadium</div>
              <h1 className="mt-2 font-display text-[32px] font-bold tracking-tight text-ink-main md:text-[52px]">
                {stadium.name}
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-4">
                <span className="flex items-center gap-1.5 text-[13px] text-ink-muted">
                  <MapPin className="h-3.5 w-3.5" />
                  {stadium.city}, {stadium.state}
                </span>
                {stadium.capacity && (
                  <span className="rounded-sm border border-white/10 bg-surface-800 px-2 py-0.5 text-[11px] text-ink-muted">
                    {stadium.capacity.toLocaleString('en-IN')} capacity
                  </span>
                )}
                <span className={`rounded-sm border px-2 py-0.5 text-[11px] ${stadium.modelStatus === 'available' ? 'border-accent/30 bg-accent/10 text-accent' : 'border-orange-500/30 bg-orange-500/10 text-orange-500'}`}>
                  {stadium.modelStatus === 'available' ? 'Licensed 3D' : '3D Model Coming Soon'}
                </span>
              </div>
            </div>
            {stadium.modelStatus !== 'available' && (
              <p className="mt-4 text-[11px] text-ink-dim border-t border-white/5 pt-4">
                The interactive 3D reconstruction for this environment will be available once the model asset is added.
              </p>
            )}
          </div>
        </div>
      </section>

      <section>
        <StadiumViewer stadium={stadium} fallbackLink="#info" />
      </section>

      <section id="info" className="border-t border-white/5 bg-surface-950">
        <div className="mx-auto grid max-w-[1600px] gap-8 px-6 py-14 md:grid-cols-[2fr_1fr] md:px-10 md:py-20">
          <div>
            <div className="text-[11px] uppercase tracking-[0.22em] text-ink-muted">About</div>
            <h2 className="mt-2 font-display text-[24px] font-semibold text-ink-main">
              {stadium.name}
            </h2>
            <p className="mt-4 max-w-2xl text-[14px] leading-relaxed text-ink-muted">
              {stadium.description}
            </p>
          </div>
          <div>
            <StadiumInfo stadium={stadium} />
          </div>
        </div>
      </section>
    </>
  );
}
