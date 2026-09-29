import { MapPin, Calendar, Users, CheckCircle } from 'lucide-react';
import type { Stadium } from '@/types/stadium';

export function StadiumInfo({ stadium }: { stadium: Stadium }) {
  const items = [
    { label: 'Location', value: `${stadium.city}, ${stadium.state}`, icon: MapPin },
    { label: 'Capacity', value: stadium.capacity ? `${stadium.capacity.toLocaleString('en-IN')} spectators` : 'Data unavailable', icon: Users },
    { label: 'Opened', value: stadium.opened ? String(stadium.opened) : 'Data unavailable', icon: Calendar },
    { label: '3D Model', value: stadium.modelStatus === 'available' ? 'Available' : 'Coming Soon', icon: CheckCircle },
  ];

  return (
    <div className="glass rounded-md border border-white/5">
      <div className="border-b border-white/5 px-5 py-3">
        <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-ink-muted">
          Stadium Information
        </div>
      </div>
      <dl className="divide-y divide-white/5">
        {items.map((item) => (
          <div key={item.label} className="flex items-center justify-between px-5 py-3">
            <div className="flex items-center gap-2.5">
              <item.icon className="h-3.5 w-3.5 text-ink-dim" />
              <dt className="text-[12px] text-ink-muted">{item.label}</dt>
            </div>
            <dd className="text-right text-[12px] font-medium text-ink-main">{item.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
