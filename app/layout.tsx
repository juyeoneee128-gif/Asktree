import type { Metadata } from 'next';
import '@/src/styles/globals.css';

export const metadata: Metadata = {
  title: 'Asktree',
  description: 'Claude Code 프로젝트의 코드 파손 감지 + 복구 + 보호 도구',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full">
      <body className="h-full antialiased">{children}</body>
    </html>
  );
}
