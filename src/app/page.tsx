import Link from 'next/link';
import { ArrowRight, Compass, Layers, Eye, Box } from 'lucide-react';
import { STADIUMS, getFeaturedStadiums } from '@/data/stadiums';
import { StadiumCard } from '@/components/stadium/StadiumCard';

export default function HomePage() {
  const featured = getFeaturedStadiums();
  const howItWorks = [
    { icon: Compass, title: 'Discover', desc: 'Browse 10+ iconic Indian cricket stadiums with verified metadata and public information.' },
    { icon: Box, title: 'Explore', desc: 'Orbit, pan and zoom through fully interactive 3D stadium environments.' },
    { icon: Layers, title: 'Select', desc: 'Drill down into stands, blocks, rows and individual seats with smooth transitions.' },
    { icon: Eye, title: 'Experience', desc: 'Preview the view from any seat with cinematic camera interpolation.' },
  ];

  return (
    <>
      <section className="relative overflow-hidden border-b border-white/5">
        <HeroBackdrop />
        <div className="relative mx-auto max-w-[1600px] px-6 pb-28 pt-24 md:px-10 md:pb-36 md:pt-32 lg:pt-40">
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-surface-800/60 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-ink-muted">
              <span className="h-1 w-1 rounded-full bg-accent" />
              Interactive 3D Venue Explorer
            </div>
            <h1 className="font-display text-[42px] font-bold leading-[1.05] tracking-tight text-ink-main md:text-[64px] lg:text-[76px]">
              Explore India's Cricket Stadiums
              <span className="text-accent"> in 3D</span>
            </h1>
            <p className="mt-6 max-w-xl text-[16px] leading-relaxed text-ink-muted md:text-[18px]">
              Discover stadiums, explore stands and experience the view from your seat — in a cinematic, interactive environment built for fans.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link
                href="/stadiums"
                className="focus-ring group inline-flex items-center gap-2 rounded-md bg-accent px-5 py-3 text-[13px] font-semibold text-surface-950 transition-colors hover:bg-accent-hover"
              >
                Explore Stadiums
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/map"
                className="focus-ring inline-flex items-center gap-2 rounded-md border border-white/15 bg-surface-800/50 px-5 py-3 text-[13px] font-semibold text-ink-main transition-colors hover:border-white/30 hover:bg-surface-800"
              >
                <Compass className="h-4 w-4" />
                View Map
              </Link>
            </div>
          </div>

          <div className="mt-20 grid grid-cols-2 gap-x-8 gap-y-6 border-t border-white/5 pt-10 md:grid-cols-4">
            <Stat label="Stadiums" value={String(STADIUMS.length)} />
            <Stat label="Indian States" value="9" />
            <Stat label="Demo seats" value="~12,000" />
            <Stat label="3D ready" value="Yes" />
          </div>
        </div>
      </section>

      <section className="border-b border-white/5 bg-surface-950">
        <div className="mx-auto max-w-[1600px] px-6 py-20 md:px-10 md:py-28">
          <div className="flex items-end justify-between gap-6">
            <div>
              <div className="text-[11px] uppercase tracking-[0.22em] text-ink-muted">Featured</div>
              <h2 className="mt-2 font-display text-[28px] font-semibold tracking-tight text-ink-main md:text-[36px]">
                Iconic stadiums
              </h2>
            </div>
            <Link href="/stadiums" className="focus-ring hidden items-center gap-1.5 text-[12px] font-medium text-accent hover:text-accent-hover md:inline-flex">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {featured.map((s, i) => (
              <StadiumCard key={s.id} stadium={s} index={i} />
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-white/5 bg-gradient-to-b from-surface-950 to-surface-900/30">
        <div className="mx-auto max-w-[1600px] px-6 py-20 md:px-10 md:py-28">
          <div className="max-w-2xl">
            <div className="text-[11px] uppercase tracking-[0.22em] text-ink-muted">How it works</div>
            <h2 className="mt-2 font-display text-[28px] font-semibold tracking-tight text-ink-main md:text-[36px]">
              From discovery to seat view — in four steps
            </h2>
            <p className="mt-4 max-w-xl text-[14px] leading-relaxed text-ink-muted">
              Stadium3D India is a premium sports-tech experience built on a clean, extensible architecture ready for real licensed stadium models and official integrations.
            </p>
          </div>

          <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {howItWorks.map((step, i) => (
              <div key={step.title} className="glass rounded-md border border-white/5 p-6 transition-all hover:border-white/15">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-surface-700 text-accent">
                  <step.icon className="h-4 w-4" />
                </div>
                <div className="mt-4 text-[10px] uppercase tracking-[0.22em] text-ink-dim">
                  Step {String(i + 1).padStart(2, '0')}
                </div>
                <h3 className="mt-1 font-display text-[16px] font-semibold text-ink-main">
                  {step.title}
                </h3>
                <p className="mt-2 text-[13px] leading-relaxed text-ink-muted">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden border-b border-white/5">
        <div className="mx-auto grid max-w-[1600px] gap-10 px-6 py-24 md:grid-cols-[1.5fr_1fr] md:px-10 md:py-32">
          <div>
            <h2 className="font-display text-[28px] font-semibold tracking-tight text-ink-main md:text-[44px]">
              Experience cricket like you're in the stadium
            </h2>
            <p className="mt-5 max-w-lg text-[14px] leading-relaxed text-ink-muted">
              Every stand, every block, every seat — all rendered in an immersive cinematic environment with smooth camera transitions.
            </p>
            <Link
              href="/stadiums"
              className="focus-ring group mt-8 inline-flex items-center gap-2 rounded-md bg-accent px-5 py-3 text-[13px] font-semibold text-surface-950 transition-colors hover:bg-accent-hover"
            >
              Begin exploring <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="glass hidden rounded-md border border-white/5 p-8 md:block">
            <div className="text-[11px] uppercase tracking-[0.22em] text-ink-muted">Currently in v1.0</div>
            <ul className="mt-5 space-y-3 text-[13px] text-ink-main">
              <li className="flex items-center gap-2"><Check /> Interactive demo stadium</li>
              <li className="flex items-center gap-2"><Check /> Stand & seat selection</li>
              <li className="flex items-center gap-2"><Check /> Cinematic seat-view camera</li>
              <li className="flex items-center gap-2"><Check /> 10 real stadiums with verified data</li>
              <li className="flex items-center gap-2"><Check /> Ready for licensed GLB models</li>
            </ul>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-display text-[30px] font-bold text-ink-main md:text-[42px]">{value}</div>
      <div className="mt-1 text-[11px] uppercase tracking-[0.22em] text-ink-muted">{label}</div>
    </div>
  );
}

function HeroBackdrop() {
  return (
    <>
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-surface-950 via-surface-950 to-surface-950/95" />
        <svg className="absolute right-0 top-0 h-full w-[60%] opacity-[0.15]" viewBox="0 0 600 600" preserveAspectRatio="xMidYMid slice">
          <defs>
            <radialGradient id="hg" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#d4a574" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#d4a574" stopOpacity="0" />
            </radialGradient>
          </defs>
          <ellipse cx="300" cy="300" rx="260" ry="200" fill="none" stroke="#d4a574" strokeWidth="1" opacity="0.3" />
          <ellipse cx="300" cy="300" rx="220" ry="170" fill="none" stroke="#d4a574" strokeWidth="1" opacity="0.2" />
          <ellipse cx="300" cy="300" rx="180" ry="140" fill="none" stroke="#d4a574" strokeWidth="1" opacity="0.15" />
          <ellipse cx="300" cy="300" rx="120" ry="90" fill="url(#hg)" />
        </svg>
      </div>
    </>
  );
}

function Check() {
  return (
    <div className="flex h-4 w-4 items-center justify-center rounded-full bg-accent/20 text-accent">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="h-2.5 w-2.5">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    </div>
  );
}

function Footer() {
  return (
    <footer className="border-t border-white/5 bg-surface-950">
      <div className="mx-auto max-w-[1600px] px-6 py-10 md:px-10">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div>
            <div className="font-display text-[13px] font-bold tracking-[0.18em] text-ink-main">
              STADIUM3D INDIA
            </div>
            <p className="mt-2 max-w-md text-[12px] text-ink-muted">
              A public 3D exploration experience for India's cricket stadiums. Not affiliated with any cricket board or team.
            </p>
          </div>
          <div className="flex flex-wrap gap-6 text-[12px] text-ink-muted">
            <Link href="/stadiums" className="hover:text-ink-main">Stadiums</Link>
            <Link href="/map" className="hover:text-ink-main">Map</Link>
            <Link href="/about" className="hover:text-ink-main">About</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
