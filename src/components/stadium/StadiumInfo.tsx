import { MapPin, Calendar, Users, CheckCircle } from 'lucide-react';
import type { Stadium } from '@/types/stadium';

interface Props {
  stadium: Stadium;
  modelAvailable?: boolean;
}

export function StadiumInfo({ stadium, modelAvailable }: Props) {
  const hasViewer = modelAvailable ?? stadium.modelStatus === 'available';
  const items = [
    { label: 'Location', value: `${stadium.city}, ${stadium.state}`, icon: MapPin },
    { label: 'Capacity', value: stadium.capacity ? `${stadium.capacity.toLocaleString('en-IN')} spectators` : 'Data unavailable', icon: Users },
    { label: 'Opened', value: stadium.opened ? String(stadium.opened) : 'Data unavailable', icon: Calendar },
    { label: 'Viewer access', value: hasViewer ? 'Interactive 3D' : 'Profile only', icon: CheckCircle },
  ];

  return (
    <div className="rounded-md border border-line bg-surface-950">
      <div className="border-b border-line bg-surface-900 px-5 py-3">
        <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-ink-muted">
          Stadium Information
        </div>
      </div>
      <dl className="divide-y divide-line">
        {items.map((item) => (
          <div key={item.label} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)] items-start gap-3 px-4 py-3 sm:flex sm:items-center sm:justify-between sm:gap-0 sm:px-5">
            <div className="flex min-w-0 items-center gap-2.5">
              <item.icon className="h-3.5 w-3.5 text-ink-dim" />
              <dt className="min-w-0 break-words text-[12px] text-ink-muted">{item.label}</dt>
            </div>
            <dd className="min-w-0 break-words text-right text-[12px] font-medium text-ink-main">{item.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
