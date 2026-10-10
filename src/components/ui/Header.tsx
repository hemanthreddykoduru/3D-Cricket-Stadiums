'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, Menu, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { SearchModal } from '@/components/search/SearchModal';

const NAV = [
  { href: '/stadiums', label: 'Stadiums' },
  { href: '/map', label: 'Map' },
  { href: '/about', label: 'About' },
];

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [shortcut, setShortcut] = useState('Ctrl K');
  const menuButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setShortcut(/Mac|iPhone|iPad/.test(navigator.platform) ? '⌘ K' : 'Ctrl K');
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === 'Escape') {
        setOpen((isOpen) => {
          if (isOpen) menuButton.current?.focus();
          return false;
        });
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => { setOpen(false); }, [pathname]);

  return (
    <>
      <header className="safe-area-top sticky top-0 z-40 border-b border-line bg-surface-950/95 backdrop-blur-xl">
        <div className="safe-area-header mx-auto flex h-[72px] max-w-[1600px] items-center justify-between">
          <Link href="/" aria-label="Stadium3D India home" className="focus-ring group flex min-w-0 min-h-11 items-center gap-3 rounded">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-line bg-surface-900 text-accent">
              <svg viewBox="0 0 32 32" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><ellipse cx="16" cy="13" rx="12" ry="7" /><path d="M4 13v6c0 4 5 7 12 7s12-3 12-7v-6M8 18v6m16-6v6M16 20v6" /><ellipse cx="16" cy="13" rx="7" ry="3.5" /></svg>
            </div>
            <div className="min-w-0 flex flex-col leading-none">
              <span className="font-display text-[22px] font-bold tracking-tight text-ink-main">
                STADIUM3D
              </span>
              <span className="mt-1 text-[9px] font-medium uppercase tracking-[0.3em] text-ink-muted">
                India
              </span>
            </div>
          </Link>

          <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
            {NAV.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={`focus-ring relative flex min-h-11 items-center rounded-md px-3.5 py-2 text-[13px] font-medium tracking-wide transition-colors ${
                    active ? 'text-accent' : 'text-ink-muted hover:text-ink-main'
                  }`}
                >
                  {item.label}
                  {active && <span className="absolute inset-x-3 -bottom-[9px] h-px bg-accent" aria-hidden="true" />}
                </Link>
              );
            })}
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={() => setSearchOpen(true)}
              aria-haspopup="dialog"
              aria-label="Search stadiums"
              className="focus-ring group hidden min-h-11 items-center gap-2 rounded-lg border border-line-strong bg-surface-950 px-3 text-[12px] text-ink-muted transition-colors hover:border-accent hover:bg-surface-900 hover:text-ink-main md:flex"
            >
              <Search className="h-3.5 w-3.5" />
              <span>Search stadiums</span>
              <kbd className="ml-4 rounded border border-line bg-surface-900 px-1.5 py-0.5 text-[10px] text-ink-dim">
                {shortcut}
              </kbd>
            </button>

            <button
              onClick={() => setSearchOpen(true)}
              aria-haspopup="dialog"
              className="focus-ring flex h-11 w-11 items-center justify-center rounded-lg border border-line bg-surface-950 text-ink-muted transition-colors hover:bg-surface-900 hover:text-ink-main md:hidden"
              aria-label="Search"
            >
              <Search className="h-4 w-4" />
            </button>

            <button
              ref={menuButton}
              onClick={() => setOpen((v) => !v)}
              className="focus-ring flex h-11 w-11 items-center justify-center rounded-lg border border-line bg-surface-950 text-ink-muted transition-colors hover:bg-surface-900 hover:text-ink-main md:hidden"
              aria-label={open ? 'Close menu' : 'Open menu'}
              aria-expanded={open}
              aria-controls="mobile-navigation"
            >
              {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {open && (
          <div id="mobile-navigation" className="border-t border-line bg-surface-950 md:hidden">
            <nav aria-label="Mobile primary" className="safe-area-nav mx-auto flex max-w-[1600px] flex-col py-3">
              {NAV.map((item) => {
                const active = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    aria-current={active ? 'page' : undefined}
                    className={`focus-ring flex min-h-11 items-center border-l-2 pl-3 py-2 text-[14px] font-medium ${
                      active ? 'border-accent text-accent' : 'border-transparent text-ink-muted'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </header>

      {searchOpen && <SearchModal onClose={() => setSearchOpen(false)} />}
    </>
  );
}
