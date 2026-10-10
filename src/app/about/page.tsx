import Link from 'next/link';
import { ArrowRight, Box, MapPin, Globe, type LucideIcon } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About',
  description: 'About Stadium3D India — a public 3D exploration experience for Indian cricket stadiums.',
};

export default function AboutPage() {
  return (
    <div className="safe-area-page mx-auto max-w-[1100px] py-16 md:py-24">
      <div className="min-w-0 max-w-2xl">
        <div className="text-[14px] font-medium text-accent">About Stadium3D India</div>
        <h1 className="mt-3 max-w-full font-display text-[36px] font-bold leading-[1.08] tracking-tight text-ink-main md:text-[56px]">
          A closer look at India's cricket grounds
        </h1>
        <p className="mt-6 text-[16px] leading-relaxed text-ink-muted">
          Stadium3D India brings together public venue profiles and an interactive 3D reconstruction of Narendra Modi Stadium. It is designed for cricket fans, stadium architects, sports-tech enthusiasts and anyone curious about the grounds.
        </p>
      </div>

      <div className="mt-14 grid gap-8 border-y border-line py-10 md:grid-cols-3">
        <Feature
          icon={Box}
          title="A ground in 3D"
          text="Explore our Narendra Modi Stadium reconstruction with orbit controls, camera presets and site layers. This is an independent visualization, not an official survey or seating plan."
        />
        <Feature
          icon={MapPin}
          title="Find your venue"
          text="Browse cricket grounds by name, city or state. Every card tells you whether an interactive model or a venue profile is available."
        />
        <Feature
          icon={Globe}
          title="Public & open"
          text="No account or sign-up needed. Venue profiles and the interactive model are open to everyone, right in your browser."
        />
      </div>

      <section className="mt-14">
        <h2 className="font-display text-[24px] font-semibold text-ink-main">Data integrity</h2>
        <p className="mt-4 max-w-2xl text-[16px] leading-relaxed text-ink-muted">
          Venue profiles contain public information. Capacities and facilities can change, so check with the venue before planning a visit. The 3D reconstruction is for exploration: it is not a ticketing service and does not provide verified views from individual seats.
        </p>
      </section>

      <section className="mt-16">
        <div className="rounded-lg border border-line bg-surface-900 p-6 md:p-10">
          <h2 className="font-display text-[24px] font-semibold text-ink-main">Ready to explore?</h2>
          <p className="mt-3 max-w-xl text-[16px] text-ink-muted">
            Start with Narendra Modi Stadium, or browse all venue profiles.
          </p>
          <Link
            href="/stadiums/narendra-modi-stadium"
            className="focus-ring mt-6 inline-flex min-h-11 items-center gap-2 rounded-md bg-accent px-5 py-3 text-[14px] font-semibold text-on-accent hover:bg-accent-hover"
          >
            Explore in 3D <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </div>
  );
}

function Feature({ icon: Icon, title, text }: { icon: LucideIcon; title: string; text: string }) {
  return (
    <div className="min-w-0">
      <Icon className="h-6 w-6 text-accent" aria-hidden="true" />
      <h2 className="mt-4 font-display text-[19px] font-semibold text-ink-main">{title}</h2>
      <p className="mt-2 text-[15px] leading-relaxed text-ink-muted">{text}</p>
    </div>
  );
}
