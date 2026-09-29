'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, Info } from 'lucide-react';
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
        <div className="flex h-full min-h-[420px] w-full flex-col items-center justify-center gap-5 border border-white/5 bg-surface-900 p-8 text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-surface-800">
            <AlertTriangle className="h-5 w-5 text-accent" />
          </div>
          <div className="max-w-md">
            <h3 className="font-display text-[15px] font-semibold text-ink-main">
              3D view unavailable
            </h3>
            <p className="mt-2 text-[12px] leading-relaxed text-ink-muted">
              WebGL could not be initialised in your browser. You can still explore stadium information below.
            </p>
          </div>
          {this.props.fallbackLink && (
            <Link
              href={this.props.fallbackLink}
              className="focus-ring inline-flex items-center gap-2 rounded-md border border-white/10 bg-surface-800 px-4 py-2 text-[12px] font-medium text-ink-main transition-colors hover:border-accent/40"
            >
              <Info className="h-3.5 w-3.5" />
              View Stadium Information
            </Link>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}
