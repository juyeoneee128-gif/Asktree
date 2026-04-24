export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-full w-full flex flex-col items-center bg-muted overflow-y-auto">
      <div className="w-full max-w-[720px] px-6 py-12 flex flex-col items-center gap-10">
        {/* Logo */}
        <div className="flex flex-col items-center gap-2">
          <h1 className="text-[28px] font-bold text-foreground">Asktree</h1>
          <p className="text-[13px] text-muted-foreground text-center">
            AI가 망가뜨린 코드를 자동으로 감지하고, 보호 규칙으로 지켜줍니다.
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
