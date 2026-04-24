export function LandingFooter() {
  return (
    <footer className="border-t border-border bg-gray-50">
      <div className="max-w-[1200px] mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
                <span className="text-white font-bold text-sm">A</span>
              </div>
              <span className="text-[17px] font-bold text-foreground tracking-tight">
                Asktree
              </span>
            </div>
            <p className="text-[13px] text-muted-foreground">
              바이브코더를 위한 코드 가디언
            </p>
          </div>

          <div className="flex flex-col gap-2 text-[13px]">
            <p className="font-semibold text-foreground mb-1">링크</p>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
              이용약관
            </a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
              개인정보처리방침
            </a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
              피드백
            </a>
          </div>

          <div className="flex flex-col gap-2 text-[13px]">
            <p className="font-semibold text-foreground mb-1">연락처</p>
            <a
              href="mailto:hello@asktree.app"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              hello@asktree.app
            </a>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-border">
          <p className="text-[12px] text-muted-foreground">
            © 2026 Asktree. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
