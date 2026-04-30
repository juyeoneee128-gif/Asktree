import type { Metadata } from 'next';
import { AboutHero } from '@/src/components/features/landing/sections/AboutHero';
import { AboutEssay } from '@/src/components/features/landing/sections/AboutEssay';

export const metadata: Metadata = {
  title: '소개 — CodeSasu',
  description: 'AI 시대의 코드 검증 체계를 만들고 있습니다.',
};

export default function AboutPage() {
  return (
    <>
      <AboutHero />
      <AboutEssay />
    </>
  );
}
