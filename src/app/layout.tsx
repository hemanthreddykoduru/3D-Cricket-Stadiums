import './globals.css';
import type { Metadata } from 'next';
import { Header } from '@/components/ui/Header';

export const metadata: Metadata = {
  metadataBase: new URL('https://stadium3d.india'),
  title: {
    default: 'Stadium3D India — Explore Indian Cricket Stadiums in 3D',
    template: '%s | Stadium3D India',
  },
  description:
    "Discover India's iconic cricket stadiums in an immersive interactive 3D experience. Explore stands, blocks, rows and seats with cinematic seat-view previews.",
  keywords: ['cricket stadium 3D', 'India cricket stadiums', 'Wankhede 3D', 'Eden Gardens', 'stadium viewer', 'seat view 3D'],
  openGraph: {
    title: 'Stadium3D India — Explore Indian Cricket Stadiums in 3D',
    description: 'Discover stadiums, explore stands and experience the view from your seat.',
    type: 'website',
    locale: 'en_IN',
  },
  twitter: { card: 'summary_large_image' },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
      </head>
      <body className="min-h-screen bg-surface-950 text-ink-main noise-overlay transition-colors duration-300">
        <div className="flex min-h-screen flex-col">
          <Header />
          <main className="flex-1">{children}</main>
        </div>
      </body>
    </html>
  );
}
