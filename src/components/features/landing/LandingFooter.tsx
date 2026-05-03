import Image from 'next/image';
import Link from 'next/link';

export function LandingFooter() {
  return (
    <footer className="border-t border-border bg-gray-50">
      <div className="max-w-[1200px] mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8">
          <div className="flex flex-col gap-3">
            <Image
              src="/logo/logo-lockup-light.svg"
              alt="CodeSasu"
              width={140}
              height={28}
            />
            <p className="text-[13px] text-muted-foreground">
              내 손안의 사수 개발자
            </p>
          </div>

          <div className="flex flex-col gap-2 text-[13px]">
            <p className="font-semibold text-foreground mb-1">Company</p>
            <Link
              href="/about"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              소개
            </Link>
            <Link
              href="/contact"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              문의
            </Link>
          </div>

          <div className="flex flex-col gap-2 text-[13px]">
            <p className="font-semibold text-foreground mb-1">연락처</p>
            <a
              href="mailto:juyeoneee128@korea.ac.kr"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              juyeoneee128@korea.ac.kr
            </a>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-border">
          <p className="text-[12px] text-muted-foreground">
            © 2026 CodeSasu · All rights reserved
          </p>
        </div>
      </div>
    </footer>
  );
}
