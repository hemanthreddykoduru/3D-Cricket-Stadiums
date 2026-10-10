import { notFound } from 'next/navigation';
import { STADIUMS, getStadiumBySlug } from '@/data/stadiums';
import { STADIUM_ASSETS } from '@/data/stadiumAssets';
import { StadiumViewer } from '@/components/3d/StadiumViewer';
import { StadiumInfo } from '@/components/stadium/StadiumInfo';
import { ArrowLeft, ArrowRight, Box, MapPin } from 'lucide-react';
import Link from 'next/link';
import type { Metadata } from 'next';

interface Props { params: { slug: string } }

export async function generateStaticParams() {
  return STADIUMS.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const stadium = getStadiumBySlug(params.slug);
  if (!stadium) return {};
  const modelReady = stadium.modelStatus === 'available' && STADIUM_ASSETS[stadium.id]?.status === 'available';
  const description = modelReady
    ? `Explore ${stadium.name} in an interactive 3D viewer, then read the venue's public profile and location details.`
    : `Read the public profile for ${stadium.name}, including its location, capacity, opening year, and venue details.`;
  return {
    title: modelReady ? `${stadium.name} 3D` : `${stadium.name} — Venue profile`,
    description,
    openGraph: {
      title: modelReady ? `${stadium.name} 3D | Stadium3D India` : `${stadium.name} | Stadium3D India`,
      description,
    },
  };
}

export default function StadiumDetailPage({ params }: Props) {
  const stadium = getStadiumBySlug(params.slug);
  if (!stadium) notFound();
  const modelReady = stadium.modelStatus === 'available' && STADIUM_ASSETS[stadium.id]?.status === 'available';

  return (
    <>
      <section className="border-b border-line bg-surface-950">
        <div className="safe-area-page mx-auto max-w-[1600px] py-10 md:py-14">
          <Link
            href="/stadiums"
            className="focus-ring mb-6 inline-flex min-h-11 items-center gap-1.5 text-[12px] text-ink-muted hover:text-ink-main"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> All stadiums
          </Link>
          <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-end">
            <div className="min-w-0">
              <div className="text-[11px] uppercase tracking-[0.22em] text-ink-muted">Stadium</div>
              <h1 className="mt-2 max-w-full break-words font-display text-[32px] font-bold tracking-tight text-ink-main md:text-[52px]">
                {stadium.name}
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-4">
                <span className="flex min-w-0 items-center gap-1.5 text-[13px] text-ink-muted">
                  <MapPin className="h-3.5 w-3.5" />
                  {stadium.city}, {stadium.state}
                </span>
                {!!stadium.capacity && (
                  <span className="rounded-sm border border-line bg-surface-900 px-2 py-0.5 text-[11px] text-ink-muted">
                    {stadium.capacity.toLocaleString('en-IN')} capacity
                  </span>
                )}
                <span className={`rounded-full border px-2.5 py-1 text-[11px] ${modelReady ? 'border-accent/30 bg-surface-900 text-accent' : 'border-line bg-surface-900 text-ink-muted'}`}>
                  {modelReady ? 'Interactive 3D' : 'Profile available'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section>
        {modelReady ? <StadiumViewer stadium={stadium} fallbackLink="#info" /> : <ModelPlaceholder stadium={stadium} />}
      </section>

      <section id="info" className="scroll-mt-24 border-t border-line bg-surface-950">
        <div className="safe-area-page mx-auto grid max-w-[1600px] gap-8 py-14 md:grid-cols-[2fr_1fr] md:py-20">
          <div className="min-w-0">
            <div className="text-[11px] uppercase tracking-[0.22em] text-ink-muted">About</div>
            <h2 className="mt-2 break-words font-display text-[24px] font-semibold text-ink-main">
              {stadium.name}
            </h2>
            <p className="mt-4 max-w-2xl text-[14px] leading-relaxed text-ink-muted">
              {stadium.description}
            </p>
          </div>
          <div className="min-w-0">
            <StadiumInfo stadium={stadium} modelAvailable={modelReady} />
          </div>
        </div>
      </section>
    </>
  );
}

function ModelPlaceholder({ stadium }: { stadium: NonNullable<ReturnType<typeof getStadiumBySlug>> }) {
  const availableViewer = STADIUM_ASSETS['narendra-modi-stadium'];
  const hasAvailableViewer = stadium.id !== 'narendra-modi-stadium'
    && availableViewer?.status === 'available'
    && Boolean(availableViewer.stadiumModel);

  return (
    <div className="safe-area-page mx-auto max-w-[1600px] py-8 md:py-12">
      <div className="relative overflow-hidden rounded-2xl border border-line bg-surface-900 p-6 md:p-10">
        <div className="relative grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="flex min-w-0 items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-line bg-surface-950 text-accent">
              <Box className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-accent">Profile only</p>
              <h2 className="mt-2 break-words font-display text-[24px] font-semibold leading-tight text-ink-main">
                No 3D model available
              </h2>
              <p className="mt-3 max-w-xl text-[13px] leading-relaxed text-ink-muted">
                Explore {stadium.name}&apos;s location, capacity, and background in the venue profile below.
              </p>
              <a href="#info" className="focus-ring mt-4 inline-flex min-h-11 items-center gap-2 rounded text-[12px] font-medium text-ink-main hover:text-accent">
                Read venue profile <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
            </div>
          </div>
          <div className="min-w-0">
            {hasAvailableViewer && (
              <Link
                href="/stadiums/narendra-modi-stadium"
                className="focus-ring inline-flex min-h-11 max-w-full items-center gap-2 break-words rounded-md bg-accent px-4 py-3 text-left text-[12px] font-semibold text-on-accent transition-colors hover:bg-accent-hover"
              >
                Open Narendra Modi Stadium in 3D <ArrowRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
