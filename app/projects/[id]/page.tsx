import { redirect } from 'next/navigation';

export default function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  // 프로젝트 진입 시 현황 탭으로 리다이렉트
  return redirect(`/projects/${params}/status`);
}
