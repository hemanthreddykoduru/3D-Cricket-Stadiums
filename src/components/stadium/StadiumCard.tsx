import Link from 'next/link';
import { ArrowRight, MapPin, Box } from 'lucide-react';
import type { Stadium } from '@/types/stadium';

export function StadiumCard({ stadium, index }: { stadium: Stadium; index?: number }) {
  return (
    <Link
      href={`/stadiums/${stadium.slug}`}
      className="group relative flex flex-col overflow-hidden rounded-md border border-white/5 bg-surface-900 transition-all duration-300 hover:border-white/15 hover:bg-surface-800"
      style={{ animationDelay: index ? `${index * 60}ms` : '0ms' }}
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-surface-800 via-surface-900 to-surface-950">
        <StadiumVisual slug={stadium.slug} />
        <div className="absolute inset-0 bg-gradient-to-t from-surface-950 via-surface-950/30 to-transparent" />
        <div className="absolute right-3 top-3">
          <span className="inline-flex items-center gap-1.5 rounded-sm border border-white/10 bg-surface-950/70 px-2 py-1 text-[9px] uppercase tracking-wider text-ink-muted backdrop-blur">
            <Box className="h-2.5 w-2.5" />
            {stadium.modelStatus === 'available' ? '3D Model' : '3D Coming Soon'}
          </span>
        </div>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-[17px] font-semibold leading-tight text-ink-main">
          {stadium.name}
        </h3>
        <div className="mt-1.5 flex items-center gap-1.5 text-[12px] text-ink-muted">
          <MapPin className="h-3 w-3" />
          {stadium.city}, {stadium.state}
        </div>
        {stadium.capacity && (
          <div className="mt-1 text-[11px] text-ink-dim">
            Capacity: {stadium.capacity.toLocaleString('en-IN')}
          </div>
        )}
        <div className="mt-auto flex items-center justify-between pt-5">
          <span className="text-[11px] uppercase tracking-[0.18em] text-ink-dim">Explore</span>
          <div className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 text-ink-muted transition-all group-hover:border-accent group-hover:bg-accent group-hover:text-surface-950">
            <ArrowRight className="h-3.5 w-3.5" />
          </div>
        </div>
      </div>
    </Link>
  );
}

function StadiumVisual({ slug }: { slug: string }) {
  const palettes: Record<string, [string, string]> = {
    'wankhede-stadium': ['#3a506b', '#5b7fa5'],
    'eden-gardens': ['#2d3a2d', '#506a4a'],
    'm-chinnaswamy-stadium': ['#3a3150', '#6a5085'],
    'narendra-modi-stadium': ['#4a3a2d', '#8a6b4a'],
    'ma-chidambaram-stadium': ['#3a2d2d', '#6a4a4a'],
    'arun-jaitley-stadium': ['#2d3a3a', '#4a6a6a'],
    'ekana-stadium': ['#3a3a2d', '#6a6a4a'],
    'rajiv-gandhi-stadium': ['#2d2d3a', '#4a4a6a'],
    'maharashtra-cricket-association-stadium': ['#3a2d3a', '#6a4a6a'],
    'sawai-mansingh-stadium': ['#4a3a3a', '#8a6a6a'],
  };
  const [a, b] = palettes[slug] || ['#2a2a2e', '#5a5a60'];

  return (
    <svg viewBox="0 0 200 125" className="h-full w-full">
      <defs>
        <radialGradient id={`g-${slug}`} cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor={b} stopOpacity="0.35" />
          <stop offset="100%" stopColor={a} stopOpacity="0.05" />
        </radialGradient>
      </defs>
      <rect width="200" height="125" fill={a} />
      <rect width="200" height="125" fill={`url(#g-${slug})`} />
      <ellipse cx="100" cy="65" rx="72" ry="44" fill="none" stroke={b} strokeOpacity="0.5" strokeWidth="1" />
      <ellipse cx="100" cy="65" rx="58" ry="34" fill="none" stroke={b} strokeOpacity="0.3" strokeWidth="0.5" />
      <ellipse cx="100" cy="65" rx="42" ry="24" fill={b} fillOpacity="0.18" stroke={b} strokeOpacity="0.6" strokeWidth="0.5" />
      <rect x="90" y="58" width="20" height="14" fill="#3a4a2a" fillOpacity="0.55" />
      <path d="M 30 65 Q 100 10 170 65" fill="none" stroke="#d4a574" strokeOpacity="0.35" strokeWidth="1" />
      <path d="M 30 65 Q 100 120 170 65" fill="none" stroke="#d4a574" strokeOpacity="0.35" strokeWidth="1" />
    </svg>
  );
}
