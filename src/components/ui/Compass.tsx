'use client';

import { useFrame } from '@react-three/fiber';

interface Props { azimuth: number; }

export function Compass({ azimuth }: Props) {
  const deg = ((azimuth * 180) / Math.PI + 360) % 360;

  return (
    <div className="glass relative flex h-16 w-16 items-center justify-center rounded-full">
      <div
        className="absolute inset-2 rounded-full border border-white/10"
        style={{ transform: `rotate(${-deg}deg)`, transition: 'transform 0.2s ease-out' }}
      >
        <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-[1px]">
          <div className="h-2 w-[2px] bg-accent" />
        </div>
        <div className="absolute left-1/2 bottom-0 -translate-x-1/2 translate-y-[1px]">
          <div className="h-2 w-[2px] bg-white/30" />
        </div>
        <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-[1px]">
          <div className="h-[2px] w-2 bg-white/30" />
        </div>
        <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-[1px]">
          <div className="h-[2px] w-2 bg-white/30" />
        </div>
      </div>
      <div className="relative flex flex-col items-center">
        <span className="text-[9px] font-bold text-accent">N</span>
        <div className="h-[1px] w-4 bg-white/10 my-0.5" />
        <span className="text-[9px] text-ink-muted">S</span>
      </div>
    </div>
  );
}

export function AzimuthBridge({ onChange }: { onChange: (a: number) => void }) {
  useFrame(({ camera }) => {
    const dir = camera.getWorldDirection(new (camera as any).position.constructor());
    const az = Math.atan2(dir.x, dir.z);
    onChange(az);
  });
  return null;
}
