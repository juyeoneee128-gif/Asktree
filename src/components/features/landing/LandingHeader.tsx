'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { Button } from '@/src/components/ui';

const NAV_LINKS = [
  { href: '/about', label: '소개' },
  { href: '/', label: '기능 소개' },
  { href: '/#faq', label: 'FAQ' },
  { href: '/contact', label: '문의' },
];

export function LandingHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  function handleLogoClick() {
    setOpen(false);
    if (pathname === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur-sm border-b border-border">
      <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-10">
          <Link href="/" className="flex items-center gap-2" onClick={handleLogoClick}>
            <Image
              src="/logo/logo-lockup-light.svg"
              alt="CodeSasu"
              width={140}
              height={28}
              priority
            />
          </Link>

          <nav className="hidden md:flex items-center gap-7">
            {NAV_LINKS.map((link) => (
              <Link
                key={`${link.href}-${link.label}`}
                href={link.href}
                className="text-[14px] font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/#register" onClick={() => setOpen(false)}>
            <Button size="sm">사전 등록하기</Button>
          </Link>

          <button
            type="button"
            aria-label={open ? '메뉴 닫기' : '메뉴 열기'}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="md:hidden inline-flex items-center justify-center w-10 h-10 -mr-2 rounded-lg text-foreground hover:bg-muted transition-colors"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-border bg-white">
          <nav className="max-w-[1200px] mx-auto px-6 py-3 flex flex-col">
            {NAV_LINKS.map((link) => (
              <Link
                key={`m-${link.href}-${link.label}`}
                href={link.href}
                onClick={() => setOpen(false)}
                className="min-h-[48px] flex items-center text-[15px] font-medium text-foreground hover:text-primary transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
