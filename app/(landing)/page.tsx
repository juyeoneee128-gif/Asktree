import { redirect } from 'next/navigation';
import { createClient } from '@/src/lib/supabase/server';
import { Hero } from '@/src/components/features/landing/sections/Hero';
import { Problem } from '@/src/components/features/landing/sections/Problem';
import { CoreValue } from '@/src/components/features/landing/sections/CoreValue';
import { Features } from '@/src/components/features/landing/sections/Features';
import { HowItWorks } from '@/src/components/features/landing/sections/HowItWorks';
import { DataPolicy } from '@/src/components/features/landing/sections/DataPolicy';
import { FAQ } from '@/src/components/features/landing/sections/FAQ';
import { Register } from '@/src/components/features/landing/sections/Register';

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
      <CoreValue />
      <Features />
      <HowItWorks />
      <DataPolicy />
      <FAQ />
      <Register />
    </>
  );
}
