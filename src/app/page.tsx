import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Box, Compass, MapPin, MoveUpRight, Orbit, Layers } from 'lucide-react';
import { PUBLIC_STADIUMS, getFeaturedStadiums } from '@/data/stadiums';
import { StadiumCard } from '@/components/stadium/StadiumCard';

export default function HomePage() {
  const featured = getFeaturedStadiums().slice(0, 4);
  const stateCount = new Set(PUBLIC_STADIUMS.map((stadium) => stadium.state)).size;
  const availableCount = PUBLIC_STADIUMS.filter((stadium) => stadium.modelStatus === 'available').length;

  return (
    <>
      <section className="relative overflow-hidden border-b border-line">
        <div className="safe-area-home mx-auto grid max-w-[1600px] items-center gap-10 pb-14 pt-10 md:pb-20 md:pt-14 lg:grid-cols-[0.85fr_1.15fr] lg:gap-12">
          <div className="min-w-0">
            <p className="flex items-center gap-2.5 text-[11px] font-medium uppercase tracking-[0.2em] text-accent">
              <span className="h-px w-7 bg-accent" aria-hidden="true" />
              Indian cricket. A different angle.
            </p>
            <h1 className="mt-5 max-w-full font-display text-[clamp(3.25rem,15vw,4rem)] font-semibold leading-[0.95] tracking-[-0.02em] sm:text-[80px] lg:text-[76px] xl:text-[96px]">
              Beyond<br />the boundary<span className="text-accent">.</span>
            </h1>
            <p className="mt-6 max-w-md text-[16px] leading-relaxed text-ink-muted">
              Discover India&apos;s cricket grounds and explore Narendra Modi Stadium in 3D, from the roofline to the pitch.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/stadiums/narendra-modi-stadium" className="focus-ring group inline-flex min-h-12 items-center gap-3 whitespace-nowrap rounded-lg bg-accent px-5 text-[14px] font-semibold text-on-accent transition-colors hover:bg-accent-hover active:bg-accent-hover">
                <Box className="h-4 w-4" aria-hidden="true" />
                Explore in 3D
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </Link>
              <Link href="/stadiums" className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-4 text-[14px] font-semibold text-ink-main transition-colors hover:bg-surface-850 active:bg-surface-800">
                Browse stadiums <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>

          <FeaturedModel />
        </div>

        <div className="border-t border-line bg-surface-900">
          <dl className="safe-area-home mx-auto grid max-w-[1600px] grid-cols-1 gap-3 py-6 sm:grid-cols-3 sm:gap-4 md:grid-cols-[1fr_1fr_1fr_auto]">
            <Stat value={String(PUBLIC_STADIUMS.length)} label="Cricket grounds" />
            <Stat value={String(stateCount)} label="States & territories" />
            <Stat value={String(availableCount)} label="3D experience" />
            <div className="hidden items-center border-l border-line pl-10 md:flex">
              <Link href="/map" className="focus-ring flex min-h-11 items-center gap-3 text-[13px] text-ink-muted transition-colors hover:text-accent">
                <Compass className="h-5 w-5 text-accent" aria-hidden="true" /> Find a ground on the map <MoveUpRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </dl>
        </div>
      </section>

      <section className="safe-area-home mx-auto max-w-[1600px] py-14 md:py-20" aria-labelledby="featured-heading">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <h2 id="featured-heading" className="font-display text-[34px] font-semibold leading-tight md:text-[44px]">Iconic venues. Individual stories.</h2>
            <p className="mt-3 text-[14px] text-ink-muted">Start with a familiar ground, or discover somewhere new.</p>
          </div>
          <Link href="/stadiums" className="focus-ring inline-flex min-h-11 items-center gap-2 text-[13px] font-medium text-accent hover:text-accent-hover">
            Browse stadiums <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {featured.map((stadium) => <StadiumCard key={stadium.id} stadium={stadium} />)}
        </div>
      </section>

      <ExploreGuide />
    </>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-3">
      <dd className="font-display text-[26px] font-semibold tabular-nums text-ink-main">{value}</dd>
      <dt className="text-[10px] uppercase tracking-[0.1em] text-ink-muted sm:text-[11px]">{label}</dt>
    </div>
  );
}

function FeaturedModel() {
  return (
    <Link href="/stadiums/narendra-modi-stadium" aria-label="Explore Narendra Modi Stadium in 3D" className="focus-ring group relative block overflow-hidden rounded-2xl border border-line bg-surface-950 shadow-[0_16px_48px_-24px_rgba(24,45,65,0.22)] transition-shadow hover:shadow-[0_20px_48px_-24px_rgba(24,45,65,0.3)]">
      <div className="relative aspect-[1672/941]">
        <Image src="/narendra-modi-stadium.jpg" alt="Aerial view of Narendra Modi Stadium in Ahmedabad, with orange and blue stands and a white roof" fill priority sizes="(max-width: 1023px) 100vw, 55vw" className="object-cover object-center" />
      </div>
      <div className="flex items-center justify-between gap-4 px-5 pb-4 pt-5 sm:px-6">
          <div className="min-w-0">
            <p className="mb-1.5 flex items-center gap-1.5 text-[12px] text-ink-muted"><MapPin className="h-3.5 w-3.5" aria-hidden="true" /> Ahmedabad, Gujarat</p>
            <h2 className="break-words font-display text-[28px] font-semibold leading-[1.1] text-ink-main sm:text-[34px]">Narendra Modi Stadium</h2>
          </div>
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-surface-850 text-accent transition-colors group-hover:bg-accent group-hover:text-on-accent"><MoveUpRight className="h-5 w-5" aria-hidden="true" /></span>
      </div>
      <div className="mx-5 flex flex-wrap items-center justify-between gap-2 border-t border-line py-3 text-[12px] text-ink-muted sm:mx-6">
        <span><span className="font-semibold tabular-nums text-ink-main">1,32,000</span> capacity</span>
        <span className="flex items-center gap-2 text-accent"><Orbit className="h-3.5 w-3.5" aria-hidden="true" /> Explore in 3D</span>
      </div>
    </Link>
  );
}

function ExploreGuide() {
  const tools = [
    { icon: Orbit, title: 'Find your angle', description: 'Rotate the model, zoom into the architecture, or switch to a top-down or pitch view.' },
    { icon: Layers, title: 'See the bigger picture', description: 'Use layers to show or hide the surrounding site, access routes and parking.' },
    { icon: MapPin, title: 'Know the ground', description: 'Read venue profiles with locations, capacities and a little of the history behind each ground.' },
  ];

  return (
    <section className="border-t border-line bg-surface-900">
      <div className="safe-area-home mx-auto grid max-w-[1600px] gap-10 py-14 md:py-20 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
        <div className="min-w-0">
          <h2 className="font-display text-[36px] font-semibold leading-tight md:text-[44px]">The ground is yours<br />to explore.</h2>
          <p className="mt-4 max-w-sm text-[14px] leading-relaxed text-ink-muted">Start with our Narendra Modi Stadium reconstruction. More venue profiles are available in the directory.</p>
          <Link href="/about" className="focus-ring mt-5 inline-flex min-h-11 items-center gap-2 text-[13px] text-accent hover:text-accent-hover">About the project <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
        </div>
        <div className="divide-y divide-line">
          {tools.map(({ icon: Icon, title, description }) => (
            <div key={title} className="flex gap-5 py-6 first:pt-0 last:pb-0">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center text-accent"><Icon className="h-6 w-6" aria-hidden="true" /></span>
              <div className="min-w-0">
                <h3 className="font-display text-[24px] font-semibold">{title}</h3>
                <p className="mt-1.5 max-w-lg text-[14px] leading-relaxed text-ink-muted">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
