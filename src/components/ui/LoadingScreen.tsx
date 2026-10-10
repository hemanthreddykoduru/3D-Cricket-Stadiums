'use client';

import { StadiumLoadingArt } from './StadiumLoadingArt';
import styles from './LoadingScreen.module.css';

interface Props {
  label?: string;
  progress?: number;
  phase?: 'opening' | 'loading' | 'preparing';
}

const statusText = {
  opening: 'Opening the stadium viewer',
  loading: 'Loading stadium resources',
  preparing: 'Preparing your view',
};

const phaseDetail = {
  opening: 'Starting the 3D viewer for this stadium.',
  loading: 'Downloading the stadium model and textures.',
  preparing: 'Setting up the scene and your first viewpoint.',
};

export function LoadingScreen({
  label = 'Stadium3D India',
  progress,
  phase = 'loading',
}: Props) {
  const value = phase === 'loading' && typeof progress === 'number' && Number.isFinite(progress)
    ? Math.min(100, Math.max(0, progress))
    : undefined;

  return (
    <div className={`h-full w-full ${styles.screen}`}>
      <div className={styles.content}>
        <div className={styles.illustration}>
          <StadiumLoadingArt phase={phase} />
        </div>

        <div className={styles.copy}>
          <h2 className={`font-display ${styles.title}`}>{label}</h2>
          <p className={styles.status} role="status" aria-live="polite" aria-atomic="true">
            {statusText[phase]}
          </p>
          <p className={styles.detail}>{phaseDetail[phase]}</p>
        </div>

        <div
          className={styles.progress}
          role="progressbar"
          aria-label={`${label} viewer progress`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={value}
        >
          <span className={styles.track} aria-hidden="true">
            <span
              className={value === undefined ? styles.indeterminate : styles.fill}
              style={value === undefined ? undefined : { width: `${value}%` }}
            />
          </span>
          {value !== undefined && (
            <span className={styles.percentage} aria-hidden="true">{Math.round(value)}%</span>
          )}
        </div>

      </div>
    </div>
  );
}
