'use client';

import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/src/components/ui';

interface FeatureItem {
  label: string;
  href: string;
}

const featureItems: FeatureItem[] = [
  { label: '이슈 감지', href: '#value' },
  { label: '현황 트래킹', href: '#value' },
  { label: 'CLAUDE.md 보호', href: '#value' },
  { label: '세션 로그', href: '#how-it-works' },
];

export function LandingHeader() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur-sm border-b border-border">
      <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
            <span className="text-white font-bold text-sm">A</span>
          </div>
          <span className="text-[17px] font-bold text-foreground tracking-tight">
            Asktree
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-7">
          <div ref={dropdownRef} className="relative">
            <button
              type="button"
              onClick={() => setDropdownOpen((v) => !v)}
              className="inline-flex items-center gap-1 text-[14px] font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              주요 기능
              <ChevronDown size={14} className={dropdownOpen ? 'rotate-180 transition-transform' : 'transition-transform'} />
            </button>
            {dropdownOpen && (
              <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-border py-1.5">
                {featureItems.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    onClick={() => setDropdownOpen(false)}
                    className="block px-4 py-2 text-[14px] text-foreground hover:bg-muted transition-colors"
                  >
                    {item.label}
                  </a>
                ))}
              </div>
            )}
          </div>
          <a href="#final-cta" className="text-[14px] font-medium text-muted-foreground hover:text-foreground transition-colors">
            가격 정책
          </a>
          <a href="#faq" className="text-[14px] font-medium text-muted-foreground hover:text-foreground transition-colors">
            FAQ
          </a>
          <a href="#" className="text-[14px] font-medium text-muted-foreground hover:text-foreground transition-colors">
            피드백
          </a>
        </nav>

        <Link href="/auth/login">
          <Button variant="outline" size="sm">
            로그인
          </Button>
        </Link>
      </div>
    </header>
  );
}
