import type { ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: (string | ClassValue | undefined | null | false)[]) {
  return inputs.filter(Boolean).join(' ');
}

export const formatNumber = (n?: number): string => {
  if (typeof n !== 'number') return '—';
  return n.toLocaleString('en-IN');
};

export const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));
