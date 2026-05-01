import type { Metadata } from 'next';
import { AboutHero } from '@/src/components/features/landing/sections/AboutHero';
import { AboutEssay } from '@/src/components/features/landing/sections/AboutEssay';

export const metadata: Metadata = {
  title: '소개 — CodeSasu',
  description: '코드를 모르는 빌더를 위한 사수 개발자를 만들고 있습니다',
};

export default function AboutPage() {
  return (
    <>
      <AboutHero />
      <AboutEssay />
    </>
  );
}
