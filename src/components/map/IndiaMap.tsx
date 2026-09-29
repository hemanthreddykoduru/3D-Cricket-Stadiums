'use client';

import { useState } from 'react';
import type { Stadium } from '@/types/stadium';

function project(lat: number, lng: number): [number, number] {
  const x = ((lng - 68) / (98 - 68)) * 400;
  const y = ((38 - lat) / (38 - 6)) * 480;
  return [x, y];
}

const INDIA_PATH = `M 90,180
  Q 60,200 55,240 Q 50,280 70,310 Q 90,340 110,360
  Q 140,400 180,430 Q 220,455 260,455 Q 290,450 310,430
  Q 330,410 340,380 Q 355,340 360,300 Q 362,260 350,230
  Q 340,200 320,180 Q 310,150 295,130 Q 275,110 255,90
  Q 230,75 205,80 Q 185,88 165,90 Q 145,88 130,95
  Q 115,110 105,130 Q 95,155 90,180 Z`;

interface Props {
  stadiums: Stadium[];
  onSelect: (stadium: Stadium) => void;
  selected?: Stadium | null;
}

export function IndiaMap({ stadiums, onSelect, selected }: Props) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <div className="relative aspect-[400/480] w-full max-w-2xl mx-auto">
      <svg
        viewBox="0 0 400 480"
        className="h-full w-full"
        style={{ filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.4))' }}
      >
        <defs>
          <radialGradient id="india-fill" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="#1a1a1c" />
            <stop offset="100%" stopColor="#0a0a0b" />
          </radialGradient>
          <linearGradient id="stroke-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#d4a574" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#d4a574" stopOpacity="0.15" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g stroke="rgba(255,255,255,0.03)" strokeWidth="0.5">
          {Array.from({ length: 8 }).map((_, i) => (
            <line key={`h-${i}`} x1="0" y1={i * 60} x2="400" y2={i * 60} />
          ))}
          {Array.from({ length: 8 }).map((_, i) => (
            <line key={`v-${i}`} x1={i * 50} y1="0" x2={i * 50} y2="480" />
          ))}
        </g>

        <path
          d={INDIA_PATH}
          fill="url(#india-fill)"
          stroke="url(#stroke-grad)"
          strokeWidth="1.2"
        />

        {stadiums
          .filter((s) => s.coordinates)
          .map((s) => {
            const [x, y] = project(s.coordinates!.lat, s.coordinates!.lng);
            const isSelected = selected?.id === s.id;
            const isHovered = hoveredId === s.id;
            return (
              <g
                key={s.id}
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHoveredId(s.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => onSelect(s)}
              >
                {(isSelected || isHovered) && (
                  <circle cx={x} cy={y} r="14" fill="#d4a574" fillOpacity="0.15">
                    <animate attributeName="r" values="8;18;8" dur="2s" repeatCount="indefinite" />
                  </circle>
                )}
                <circle
                  cx={x}
                  cy={y}
                  r={isSelected ? 6 : 4.5}
                  fill="#d4a574"
                  stroke="#050505"
                  strokeWidth="1.5"
                  filter={isSelected ? 'url(#glow)' : undefined}
                  style={{ transition: 'r 0.2s ease' }}
                />
                {(isSelected || isHovered) && (
                  <g transform={`translate(${x + 10}, ${y - 6})`}>
                    <rect
                      x="0" y="0"
                      width={s.name.length * 5.5 + 14}
                      height="16"
                      rx="2"
                      fill="#050505"
                      fillOpacity="0.95"
                      stroke="rgba(255,255,255,0.15)"
                      strokeWidth="0.5"
                    />
                    <text x="7" y="11" fill="#f5f5f5" fontSize="9" fontFamily="system-ui">
                      {s.name}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
      </svg>
    </div>
  );
}
