import { LandingHeader } from '@/src/components/features/landing/LandingHeader';
import { LandingFooter } from '@/src/components/features/landing/LandingFooter';

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-full bg-white">
      <LandingHeader />
      <main className="flex-1">{children}</main>
      <LandingFooter />
    </div>
  );
}
