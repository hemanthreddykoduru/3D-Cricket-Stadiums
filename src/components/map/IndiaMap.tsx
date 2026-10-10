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
    <div className="relative mx-auto aspect-[400/480] w-full max-w-2xl min-w-0">
      <svg
        viewBox="0 0 400 480"
        className="h-full w-full"
        role="group"
        aria-label="Schematic stadium locations. Select a venue marker or use the adjacent venue list."
      >
        <g className="stroke-line" strokeWidth="0.5">
          {Array.from({ length: 8 }).map((_, i) => (
            <line key={`h-${i}`} x1="0" y1={i * 60} x2="400" y2={i * 60} />
          ))}
          {Array.from({ length: 8 }).map((_, i) => (
            <line key={`v-${i}`} x1={i * 50} y1="0" x2={i * 50} y2="480" />
          ))}
        </g>

        <path
          d={INDIA_PATH}
          className="fill-surface-800 stroke-surface-600"
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
                role="button"
                tabIndex={0}
                aria-label={`${s.name}, ${s.city}`}
                aria-pressed={isSelected}
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHoveredId(s.id)}
                onMouseLeave={() => setHoveredId(null)}
                onFocus={() => setHoveredId(s.id)}
                onBlur={() => setHoveredId(null)}
                onClick={() => onSelect(s)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onSelect(s);
                  }
                }}
              >
                <circle cx={x} cy={y} r="16" fill="transparent" />
                {(isSelected || isHovered) && (
                  <circle cx={x} cy={y} r="13" className="fill-accent stroke-accent" fillOpacity="0.1" />
                )}
                <circle
                  cx={x}
                  cy={y}
                  r={isSelected ? 6 : 4.5}
                  className="fill-accent stroke-on-accent"
                  strokeWidth="1.5"
                />
                {(isSelected || isHovered) && (
                  <g pointerEvents="none" transform={`translate(${Math.min(x + 16, 390 - (s.city.length * 7.5 + 20))}, ${y - 13})`}>
                    <rect
                      x="0" y="0"
                      width={s.city.length * 7.5 + 20}
                      height="26"
                      rx="3"
                      className="fill-surface-950 stroke-line-strong"
                      strokeWidth="0.8"
                    />
                    <text x="10" y="17" className="fill-accent" fontSize="12" fontWeight="600" fontFamily="inherit">
                      {s.city}
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
