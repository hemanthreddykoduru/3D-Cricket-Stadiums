import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, Clock3, MapPin } from 'lucide-react';
import type { Stadium } from '@/types/stadium';

export function StadiumCard({ stadium }: { stadium: Stadium; index?: number }) {
  const isAvailable = stadium.modelStatus === 'available';
  const isNarendraModi = stadium.slug === 'narendra-modi-stadium';
  const actionLabel = isAvailable ? 'Explore in 3D' : 'View venue';

  return (
    <Link
      href={`/stadiums/${stadium.slug}`}
      aria-label={`${actionLabel}: ${stadium.name}`}
      className="focus-ring group relative flex h-full min-w-0 flex-col overflow-hidden rounded-lg border border-line bg-surface-950 shadow-[0_6px_24px_rgba(36,95,158,0.05)] transition-colors hover:border-accent"
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-surface-950">
        {isNarendraModi ? (
          <Image
            src="/narendra-modi-stadium.jpg"
            alt="Aerial view of Narendra Modi Stadium in Ahmedabad"
            fill
            sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, (max-width: 1279px) 33vw, 25vw"
            className="object-cover object-center"
          />
        ) : (
          <StadiumVisual slug={stadium.slug} />
        )}
        {!isNarendraModi && <div className="absolute bottom-2.5 left-4">
          <span className="text-[11px] text-ink-dim">
            Illustrative view
          </span>
        </div>}
      </div>

      <div className="flex min-w-0 flex-1 flex-col p-4 sm:p-5">
        <div className={`mb-2.5 flex items-center gap-1.5 text-[12px] font-medium ${isAvailable ? 'text-accent' : 'text-ink-muted'}`}>
          {isAvailable ? <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> : <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />}
          {isAvailable ? '3D ready' : 'Venue profile'}
        </div>
        <h3 className="break-words font-display text-[20px] font-semibold leading-tight tracking-tight text-ink-main">
          {stadium.name}
        </h3>
        <div className="mt-2 flex items-center gap-1.5 text-[13px] text-ink-muted">
          <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span className="min-w-0 break-words">{stadium.city}, {stadium.state}</span>
        </div>

        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 border-t border-line pt-3 text-[13px] text-ink-dim">
          {stadium.capacity !== undefined && (
            <span>{stadium.capacity.toLocaleString('en-IN')} capacity</span>
          )}
          {stadium.opened !== undefined && <span>Opened {stadium.opened}</span>}
        </div>

        <div className="mt-auto flex min-h-11 items-center justify-between gap-3 pt-5 text-accent group-hover:text-accent-hover">
          <span className="text-[14px] font-semibold">
            {actionLabel}
          </span>
          <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
        </div>
      </div>
    </Link>
  );
}

function StadiumVisual({ slug }: { slug: string }) {
  const palettes: Record<string, [string, string]> = {
    'wankhede-stadium': ['#edf2f6', '#527c9e'],
    'eden-gardens': ['#eef3f2', '#5a7f83'],
    'm-chinnaswamy-stadium': ['#eff1f7', '#6c7da0'],
    'ma-chidambaram-stadium': ['#f1f3f5', '#647f94'],
    'arun-jaitley-stadium': ['#ecf3f4', '#54838c'],
    'ekana-stadium': ['#f0f3f1', '#71877e'],
    'rajiv-gandhi-stadium': ['#eef1f7', '#637da5'],
    'maharashtra-cricket-association-stadium': ['#f0f1f6', '#77849b'],
    'sawai-mansingh-stadium': ['#f2f3f5', '#7c8b9b'],
    'hpca-stadium': ['#eaf2f6', '#537f9a'],
    'barsapara-cricket-stadium': ['#edf3f2', '#5b8582'],
    'greenfield-international-stadium': ['#ebf3f1', '#57877e'],
    'aca-vdca-stadium': ['#eef3f4', '#6a8597'],
    'jsca-stadium': ['#eff2f5', '#748698'],
  };
  const [background, accent] = palettes[slug] || ['#edf2f6', '#527c9e'];

  return (
    <svg viewBox="0 0 320 180" className="h-full w-full" role="presentation" aria-hidden="true">
      <rect width="320" height="180" fill={background} />
      <ellipse cx="160" cy="91" rx="122" ry="68" fill="none" stroke={accent} strokeOpacity="0.5" strokeWidth="1.5" />
      <ellipse cx="160" cy="91" rx="99" ry="54" fill="none" stroke={accent} strokeOpacity="0.35" strokeWidth="1" />
      <ellipse cx="160" cy="91" rx="73" ry="39" fill={accent} fillOpacity="0.07" stroke={accent} strokeOpacity="0.6" strokeWidth="1" />
      <rect x="135" y="78" width="50" height="26" rx="2" fill="#c5d5c9" />
      <path d="M38 91 Q160 12 282 91" fill="none" stroke={accent} strokeOpacity="0.5" strokeWidth="1.5" />
      <path d="M38 91 Q160 170 282 91" fill="none" stroke={accent} strokeOpacity="0.5" strokeWidth="1.5" />
      <path d="M160 52 V130 M88 91 H232" stroke={accent} strokeOpacity="0.3" strokeDasharray="3 5" />
      <circle cx="42" cy="42" r="2" fill={accent} fillOpacity="0.65" />
      <circle cx="278" cy="42" r="2" fill={accent} fillOpacity="0.65" />
    </svg>
  );
}
