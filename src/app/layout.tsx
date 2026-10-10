import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Barlow_Condensed, Manrope } from 'next/font/google';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';

const bodyFont = Manrope({ subsets: ['latin'], display: 'swap', variable: '--font-body' });
const displayFont = Barlow_Condensed({ subsets: ['latin'], weight: ['600', '700'], display: 'swap', variable: '--font-display' });

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#fcfdff',
  colorScheme: 'light',
};

export const metadata: Metadata = {
  metadataBase: new URL('https://stadium3d.india'),
  title: {
    default: 'Stadium3D India — Explore Indian Cricket Stadiums in 3D',
    template: '%s | Stadium3D India',
  },
  description:
    "Discover India's cricket grounds, browse venue profiles, and explore Narendra Modi Stadium in an interactive 3D viewer.",
  keywords: ['cricket stadium 3D', 'India cricket stadiums', 'Narendra Modi Stadium', 'Eden Gardens', 'stadium viewer'],
  openGraph: {
    title: 'Stadium3D India — Explore Indian Cricket Stadiums in 3D',
    description: 'Discover the grounds behind the game. Venue profiles and interactive 3D exploration.',
    type: 'website',
    locale: 'en_IN',
  },
  twitter: { card: 'summary_large_image' },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="light">
      <body className={`${bodyFont.variable} ${displayFont.variable} min-h-screen bg-surface-950 font-sans text-ink-main`}>
        <a href="#main-content" className="focus-ring sr-only left-4 top-4 z-[600] rounded-lg bg-accent px-5 py-3 font-medium text-on-accent focus:not-sr-only focus:fixed">Skip to content</a>
        <div className="flex min-h-screen flex-col">
          <Header />
          <main id="main-content" tabIndex={-1} className="flex-1 outline-none">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
