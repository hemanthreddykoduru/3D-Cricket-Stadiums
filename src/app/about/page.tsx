import Link from 'next/link';
import { ArrowRight, Box, Code2, Globe } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About',
  description: 'About Stadium3D India — a public 3D exploration experience for Indian cricket stadiums.',
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-[1100px] px-6 py-16 md:px-10 md:py-24">
      <div className="max-w-2xl">
        <div className="text-[11px] uppercase tracking-[0.22em] text-ink-muted">About</div>
        <h1 className="mt-2 font-display text-[36px] font-bold tracking-tight text-ink-main md:text-[56px]">
          A 3D lens on India's cricket heritage
        </h1>
        <p className="mt-6 text-[16px] leading-relaxed text-ink-muted">
          Stadium3D India is a public interactive experience that lets you explore iconic Indian cricket stadiums in immersive 3D. It is designed for cricket fans, stadium architects, sports-tech enthusiasts and anyone who wants to feel closer to the game.
        </p>
      </div>

      <div className="mt-16 grid gap-5 md:grid-cols-3">
        <Feature
          icon={Box}
          title="Interactive Demo Stadium"
          text="Initial release ships with a clearly labeled demo stadium built from procedural geometry. This is explicitly not a licensed model of any real venue."
        />
        <Feature
          icon={Code2}
          title="Extensible architecture"
          text="The codebase is built to accept licensed GLB stadium models, verified seat maps and official integrations in future releases without rewriting the viewer."
        />
        <Feature
          icon={Globe}
          title="Public & open"
          text="No accounts, no login, no backend required. The entire experience runs in your browser with verified public metadata only."
        />
      </div>

      <section className="mt-24 border-t border-white/5 pt-16">
        <h2 className="font-display text-[24px] font-semibold text-ink-main">Data integrity</h2>
        <p className="mt-4 max-w-2xl text-[14px] leading-relaxed text-ink-muted">
          Stadium capacities, opening years and locations are sourced from publicly verifiable references. When exact information is not publicly available, the field displays "Data unavailable" rather than guessing. Seating layouts in the demo stadium are explicitly marked as demo data and do not represent any real venue's configuration.
        </p>
      </section>

      <section className="mt-16">
        <div className="glass rounded-md border border-white/5 p-8 md:p-12">
          <h2 className="font-display text-[22px] font-semibold text-ink-main">Ready to explore?</h2>
          <p className="mt-3 max-w-xl text-[14px] text-ink-muted">
            Jump into any stadium's interactive 3D experience.
          </p>
          <Link
            href="/stadiums"
            className="focus-ring group mt-6 inline-flex items-center gap-2 rounded-md bg-accent px-5 py-3 text-[13px] font-semibold text-surface-950 hover:bg-accent-hover"
          >
            Explore stadiums <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </section>
    </div>
  );
}

function Feature({ icon: Icon, title, text }: { icon: any; title: string; text: string }) {
  return (
    <div className="glass rounded-md border border-white/5 p-6">
      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-surface-700 text-accent">
        <Icon className="h-4 w-4" />
      </div>
      <h3 className="mt-5 font-display text-[16px] font-semibold text-ink-main">{title}</h3>
      <p className="mt-2 text-[13px] leading-relaxed text-ink-muted">{text}</p>
    </div>
  );
}
