'use client';

import { useId } from 'react';
import styles from './StadiumLoadingArt.module.css';

interface Props {
  phase: 'opening' | 'loading' | 'preparing';
}

const seatRows = [
  { rx: 143, ry: 50, cy: 110, color: '#153B96' },
  { rx: 134, ry: 46, cy: 112, color: '#ED4D10' },
  { rx: 125, ry: 42, cy: 114, color: '#153B96' },
  { rx: 116, ry: 38, cy: 116, color: '#ED4D10' },
  { rx: 108, ry: 34, cy: 118, color: '#153B96' },
];

function ellipsePoint(rx: number, ry: number, cy: number, angle: number) {
  return `${(240 + Math.cos(angle) * rx).toFixed(2)} ${(cy + Math.sin(angle) * ry).toFixed(2)}`;
}

const facadeRibs = Array.from({ length: 25 }, (_, index) =>
  `M${ellipsePoint(178, 69, 106, (index / 24) * Math.PI)}v35`,
);

const entrances = Array.from({ length: 7 }, (_, index) =>
  `M${ellipsePoint(178, 69, 130, ((index + 1) / 8) * Math.PI)}v9`,
);

const roofRibs = Array.from({ length: 40 }, (_, index) => {
  const angle = (index / 40) * Math.PI * 2;
  return `M${ellipsePoint(178, 69, 104, angle)}L${ellipsePoint(153, 55, 106, angle)}`;
});

const aisles = Array.from({ length: 32 }, (_, index) => {
  const angle = (index / 32) * Math.PI * 2;
  return `M${ellipsePoint(147, 53, 109, angle)}L${ellipsePoint(103, 31, 121, angle)}`;
});

const seatLights = Array.from({ length: 24 }, (_, index) => {
  const start = (index / 24) * Math.PI * 2 - Math.PI / 2 + 0.035;
  const end = ((index + 1) / 24) * Math.PI * 2 - Math.PI / 2 - 0.035;
  return seatRows.map(({ rx, ry, cy }) =>
    `M${ellipsePoint(rx, ry, cy, start)}A${rx} ${ry} 0 0 1 ${ellipsePoint(rx, ry, cy, end)}`,
  ).join(' ');
});

export function StadiumLoadingArt({ phase }: Props) {
  const id = useId();
  const facadeId = `${id}-facade`;
  const roofId = `${id}-roof`;
  const fieldId = `${id}-field`;
  const sweepId = `${id}-sweep`;
  const shadowId = `${id}-shadow`;
  const fieldClipId = `${id}-field-clip`;
  const roofPathId = `${id}-roof-path`;

  return (
    <svg
      className={styles.art}
      viewBox="0 0 480 280"
      fill="none"
      aria-hidden="true"
      focusable="false"
      data-loader-art="stadium"
      data-phase={phase}
    >
      <defs>
        <linearGradient id={facadeId} x1="10%" y1="0%" x2="80%" y2="100%">
          <stop stopColor="#fcfdff" />
          <stop offset="0.55" stopColor="#edf2f6" />
          <stop offset="1" stopColor="#d5e0e9" />
        </linearGradient>
        <linearGradient id={roofId} x1="20%" y1="0%" x2="65%" y2="100%">
          <stop stopColor="#fcfdff" />
          <stop offset="1" stopColor="#edf2f6" />
        </linearGradient>
        <linearGradient id={fieldId} x1="0%" y1="0%" x2="70%" y2="100%">
          <stop stopColor="#94b39b" />
          <stop offset="1" stopColor="#729a82" />
        </linearGradient>
        <linearGradient id={sweepId}>
          <stop stopColor="#fcfdff" stopOpacity="0" />
          <stop offset="0.5" stopColor="#fcfdff" stopOpacity="0.85" />
          <stop offset="1" stopColor="#fcfdff" stopOpacity="0" />
        </linearGradient>
        <radialGradient id={shadowId}>
          <stop stopColor="#9bb0c0" stopOpacity="0.55" />
          <stop offset="1" stopColor="#9bb0c0" stopOpacity="0" />
        </radialGradient>
        <clipPath id={fieldClipId}>
          <ellipse cx="240" cy="121" rx="103" ry="31" />
        </clipPath>
        <ellipse id={roofPathId} cx="240" cy="104" rx="179" ry="69" pathLength="100" />
      </defs>

      <g stroke="#d5e0e9" strokeWidth="0.8" opacity="0.75">
        <ellipse cx="240" cy="167" rx="215" ry="88" />
        <ellipse cx="240" cy="167" rx="204" ry="81" strokeDasharray="2 7" />
        <path d="M18 167h444M240 19v246M42 224 438 59M42 59l396 165" strokeDasharray="3 8" />
        <path d="M17 167h14m418 0h14M240 251v14M240 19v12" stroke="#aabfce" />
      </g>
      <ellipse
        className={styles.shadow}
        cx="240"
        cy="229"
        rx="188"
        ry="25"
        fill={`url(#${shadowId})`}
      />

      <g className={styles.stadium}>
        <g className={styles.foundation}>
          <path
            d="M52 155v8c0 40 84 73 188 73s188-33 188-73v-8"
            fill="#dce6ee"
            stroke="#c9d7e2"
          />
          <ellipse cx="240" cy="155" rx="188" ry="73" fill="#e7eef4" stroke="#d5e0e9" />
          <ellipse cx="240" cy="155" rx="182" ry="67" stroke="#fcfdff" strokeWidth="1.5" />
          <path d="M72 185c30 25 94 42 168 42s138-17 168-42" stroke="#c9d7e2" />
          <path d="m160 211-5 12m49-3-2 12m76-12 2 12m44-21 5 12" stroke="#fcfdff" />
        </g>

        <g className={styles.tiers}>
          <path
            d="M62 106v37c0 38 80 69 178 69s178-31 178-69v-37"
            fill={`url(#${facadeId})`}
            stroke="#c9d7e2"
          />
          <g stroke="#b9cbd8" strokeWidth="0.8" opacity="0.8">
            {facadeRibs.map((path, index) => <path key={index} d={path} />)}
            <path d="M62 125c0 38 80 69 178 69s178-31 178-69" />
            <path d="M62 139c0 38 80 69 178 69s178-31 178-69" />
          </g>
          <g stroke="#182d41" strokeWidth="4.5" opacity="0.2">
            {entrances.map((path, index) => <path key={index} d={path} />)}
          </g>
          <ellipse cx="240" cy="106" rx="178" ry="69" fill="#fcfdff" stroke="#d5e0e9" />
          <ellipse cx="240" cy="110" rx="151" ry="55" fill="#e0e9f1" stroke="#c9d7e2" />

          <g strokeWidth="3.6" strokeDasharray="1.6 3.2" opacity="0.72">
            {seatRows.map(({ rx, ry, cy, color }) => (
              <ellipse key={rx} cx="240" cy={cy} rx={rx} ry={ry} stroke={color} />
            ))}
          </g>
          <g stroke="#fcfdff" strokeWidth="3.6" strokeDasharray="1.6 3.2">
            {seatLights.map((path, index) => (
              <path
                key={index}
                className={styles.seatLight}
                d={path}
                style={{ animationDelay: `${(1.35 + index * 0.16).toFixed(2)}s` }}
              />
            ))}
          </g>
          <g stroke="#fcfdff" strokeWidth="1.2" opacity="0.85">
            {aisles.map((path, index) => <path key={index} d={path} />)}
          </g>

          <ellipse cx="240" cy="121" rx="105" ry="33" fill="#d5e0e9" />
          <ellipse cx="240" cy="121" rx="103" ry="31" fill={`url(#${fieldId})`} />
          <g clipPath={`url(#${fieldClipId})`}>
            <path
              d="m124 87 47 76m-19-76 47 76m-19-76 47 76m-19-76 47 76m-19-76 47 76m-19-76 47 76m-19-76 47 76"
              stroke="#fcfdff"
              strokeWidth="12"
              opacity="0.06"
            />
            <path
              className={styles.fieldSweep}
              d="m120 76 32-8 56 96-32 8Z"
              fill={`url(#${sweepId})`}
            />
          </g>
          <ellipse cx="240" cy="121" rx="95" ry="26" stroke="#fcfdff" strokeWidth="0.9" opacity="0.72" />
          <ellipse cx="240" cy="121" rx="53" ry="16" stroke="#fcfdff" strokeWidth="0.7" strokeDasharray="2 4" opacity="0.35" />
          <path d="m236 107 13 3-7 24-13-3Z" fill="#e4d7b8" />
          <path d="m234 114 13 3m-17 10 13 3" stroke="#fcfdff" strokeWidth="1.1" />
          <path d="m239 110 4 1m-1-2v3m-7 18 4 1m-1-2v3" stroke="#fcfdff" strokeWidth="0.9" />
        </g>

        <g className={styles.roof}>
          <path
            d="M61 104c0 38 80 69 179 69s179-31 179-69v4c0 38-80 69-179 69S61 146 61 108Z"
            fill="#d5e0e9"
            stroke="#c9d7e2"
          />
          <path
            d="M61 104a179 69 0 1 0 358 0a179 69 0 1 0-358 0ZM87 106a153 55 0 1 0 306 0a153 55 0 1 0-306 0Z"
            fill={`url(#${roofId})`}
            fillRule="evenodd"
            stroke="#d5e0e9"
          />
          <g stroke="#d5e0e9" strokeWidth="0.8">
            {roofRibs.map((path, index) => <path key={index} d={path} />)}
          </g>
          <ellipse cx="240" cy="104" rx="168" ry="63" stroke="#fcfdff" strokeWidth="1.6" />
          <ellipse cx="240" cy="106" rx="153" ry="55" stroke="#b9cbd8" strokeWidth="1.1" />
          <path d="M87 106c0 30 69 55 153 55s153-25 153-55" stroke="#fcfdff" strokeWidth="2" />
          <use
            className={styles.roofTrace}
            href={`#${roofPathId}`}
            stroke="#245f9e"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeDasharray="17 83"
          />
          <use
            className={styles.roofBeacon}
            href={`#${roofPathId}`}
            stroke="#245f9e"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray="0.1 99.9"
          />
        </g>
      </g>
    </svg>
  );
}
