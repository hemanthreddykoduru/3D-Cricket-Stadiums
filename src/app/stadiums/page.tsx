import { StadiumDirectory } from '@/components/stadium/StadiumDirectory';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Stadiums',
  description: 'Browse all Indian cricket stadiums available in Stadium3D India.',
};

export default function StadiumsPage() {
  return (
    <div className="safe-area-page mx-auto max-w-[1600px] py-12 md:py-20">
      <StadiumDirectory />
    </div>
  );
}
