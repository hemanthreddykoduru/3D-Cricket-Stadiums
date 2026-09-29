'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, Compass, Menu, X } from 'lucide-react';
import { useEffect, useState } from 'react';
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

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === 'Escape') setSearchOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => { setOpen(false); }, [pathname]);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-white/5 bg-surface-950/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between px-6 lg:px-10">
          <Link href="/" className="group flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-gradient-to-br from-accent to-accent-dim">
              <Compass className="h-4 w-4 text-surface-950" strokeWidth={2.5} />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-display text-[15px] font-bold tracking-tight text-ink-main">
                STADIUM3D
              </span>
              <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-ink-muted">
                India
              </span>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {NAV.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`focus-ring rounded-md px-3.5 py-2 text-[13px] font-medium tracking-wide transition-colors ${
                    active ? 'text-ink-main' : 'text-ink-muted hover:text-ink-main'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSearchOpen(true)}
              className="focus-ring group hidden items-center gap-2 rounded-md border border-white/10 bg-surface-800/60 px-3 py-1.5 text-[12px] text-ink-muted transition-colors hover:border-white/20 hover:text-ink-main md:flex"
            >
              <Search className="h-3.5 w-3.5" />
              <span>Search stadiums</span>
              <kbd className="ml-4 rounded border border-white/10 bg-surface-900 px-1.5 py-0.5 text-[10px] text-ink-dim">
                ⌘K
              </kbd>
            </button>

            <button
              onClick={() => setSearchOpen(true)}
              className="focus-ring flex h-9 w-9 items-center justify-center rounded-md border border-white/10 bg-surface-800/60 text-ink-muted transition-colors hover:text-ink-main md:hidden"
              aria-label="Search"
            >
              <Search className="h-4 w-4" />
            </button>

            <button
              onClick={() => setOpen((v) => !v)}
              className="focus-ring flex h-9 w-9 items-center justify-center rounded-md border border-white/10 bg-surface-800/60 text-ink-muted transition-colors hover:text-ink-main md:hidden"
              aria-label="Menu"
            >
              {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {open && (
          <div className="border-t border-white/5 bg-surface-950 md:hidden">
            <nav className="mx-auto flex max-w-[1600px] flex-col px-6 py-3">
              {NAV.map((item) => {
                const active = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`border-l-2 pl-3 py-2 text-[14px] font-medium ${
                      active ? 'border-accent text-ink-main' : 'border-transparent text-ink-muted'
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
