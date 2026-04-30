import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/src/components/ui';

export function LandingHeader() {
  return (
    <header className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur-sm border-b border-border">
      <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-10">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logo/logo-lockup-light.svg"
              alt="CodeSasu"
              width={140}
              height={28}
              priority
            />
          </Link>

          <nav className="hidden md:flex items-center gap-7">
            <Link
              href="/about"
              className="text-[14px] font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              소개
            </Link>
            <Link
              href="/#features"
              className="text-[14px] font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              기능 소개
            </Link>
            <Link
              href="/#faq"
              className="text-[14px] font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              FAQ
            </Link>
            <Link
              href="/contact"
              className="text-[14px] font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              문의
            </Link>
          </nav>
        </div>

        <Link href="/#register">
          <Button size="sm">사전 등록하기</Button>
        </Link>
      </div>
    </header>
  );
}
