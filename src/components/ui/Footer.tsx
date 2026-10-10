import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-line bg-surface-900">
      <div className="safe-area-footer safe-area-bottom-large mx-auto flex max-w-[1600px] flex-col gap-6 py-10 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <div className="font-display text-[13px] font-bold tracking-[0.18em] text-ink-main">
            STADIUM3D INDIA
          </div>
          <p className="mt-2 max-w-md break-words text-[12px] leading-relaxed text-ink-muted">
            A public 3D exploration experience for India&apos;s cricket stadiums. Not affiliated with any cricket board or team.
          </p>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-ink-muted sm:gap-x-6">
          <Link href="/stadiums" className="focus-ring inline-flex min-h-11 items-center transition-colors hover:text-ink-main">Stadiums</Link>
          <Link href="/map" className="focus-ring inline-flex min-h-11 items-center transition-colors hover:text-ink-main">Map</Link>
          <Link href="/about" className="focus-ring inline-flex min-h-11 items-center transition-colors hover:text-ink-main">About</Link>
        </nav>
      </div>
    </footer>
  );
}
