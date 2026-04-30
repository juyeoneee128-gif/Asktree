import type { Metadata } from 'next';
import { ContactHero } from '@/src/components/features/landing/sections/ContactHero';
import { ContactForm } from '@/src/components/features/landing/sections/ContactForm';

export const metadata: Metadata = {
  title: '문의 — CodeSasu',
  description: 'CodeSasu 팀과 이야기하기',
};

export default function ContactPage() {
  return (
    <>
      <ContactHero />
      <ContactForm />
    </>
  );
}
