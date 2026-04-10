import { redirect } from 'next/navigation';

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  // 프로젝트 진입 시 현황 탭으로 리다이렉트
  redirect(`/projects/${id}/status`);
}
