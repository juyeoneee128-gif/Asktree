import { redirect } from 'next/navigation';
import { createClient } from '@/src/lib/supabase/server';
import { Hero } from '@/src/components/features/landing/sections/Hero';
import { Problem } from '@/src/components/features/landing/sections/Problem';
import { ValueProps } from '@/src/components/features/landing/sections/ValueProps';
import { CoreFeatures } from '@/src/components/features/landing/sections/CoreFeatures';
import { HowItWorks } from '@/src/components/features/landing/sections/HowItWorks';
import { Benefits } from '@/src/components/features/landing/sections/Benefits';
import { DataPolicy } from '@/src/components/features/landing/sections/DataPolicy';
import { FAQ } from '@/src/components/features/landing/sections/FAQ';
import { FinalCTA } from '@/src/components/features/landing/sections/FinalCTA';

export default async function LandingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect('/projects');
  }

  return (
    <>
      <Hero />
      <Problem />
      <ValueProps />
      <CoreFeatures />
      <HowItWorks />
      <Benefits />
      <DataPolicy />
      <FAQ />
      <FinalCTA />
    </>
  );
}
