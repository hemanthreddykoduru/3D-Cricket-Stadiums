'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, Info, RotateCcw } from 'lucide-react';
import Link from 'next/link';

interface Props { children: ReactNode; fallbackLink?: string; }
interface State { hasError: boolean; errorMessage?: string; }

export class ViewerErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(err: Error): State {
    return { hasError: true, errorMessage: err.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[Stadium3D] viewer error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div role="alert" className="flex h-full min-h-[min(420px,100dvh)] w-full min-w-0 max-w-full flex-col items-center justify-center gap-5 overflow-x-hidden overflow-y-auto overscroll-contain border border-line bg-surface-900 px-4 py-6 text-center text-ink-main sm:min-h-[420px] sm:p-8">
          <div className="flex h-11 w-11 items-center justify-center rounded-full border border-line bg-surface-950">
            <AlertTriangle className="h-5 w-5 text-accent" />
          </div>
          <div className="min-w-0 max-w-md break-words">
            <h3 className="font-display text-[15px] font-semibold text-ink-main">
              3D viewer could not start
            </h3>
            <p className="mt-2 text-[12px] leading-relaxed text-ink-muted">
              The model could not be displayed. Check your connection and reload. If it still fails, try another WebGL-enabled browser or read the venue profile.
            </p>
          </div>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-md bg-accent px-4 py-2 text-[12px] font-semibold text-on-accent hover:bg-accent-hover"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            Reload viewer
          </button>
          {this.props.fallbackLink && (
            <Link
              href={this.props.fallbackLink}
              className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-md border border-line-strong bg-surface-950 px-4 py-2 text-[12px] font-medium text-ink-main transition-colors hover:border-accent hover:bg-surface-900"
            >
              <Info className="h-3.5 w-3.5" />
              Read venue profile
            </Link>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}
