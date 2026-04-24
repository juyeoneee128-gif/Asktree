import { notFound } from 'next/navigation';
import { createClient } from '@/src/lib/supabase/server';
import { ProjectShell } from './ProjectShell';

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  // proxy에서 이미 리다이렉트되지만 방어적으로 한 번 더 체크
  if (!authUser) {
    notFound();
  }

  const [projectRes, issueCountRes, guidelineCountRes] = await Promise.all([
    supabase
      .from('projects')
      .select('id, name, agent_status')
      .eq('id', id)
      .eq('user_id', authUser.id)
      .single(),
    supabase
      .from('issues')
      .select('id', { count: 'exact', head: true })
      .eq('project_id', id)
      .eq('status', 'unconfirmed'),
    supabase
      .from('guidelines')
      .select('id', { count: 'exact', head: true })
      .eq('project_id', id)
      .eq('status', 'unapplied'),
  ]);

  if (projectRes.error || !projectRes.data) {
    notFound();
  }

  return (
    <ProjectShell
      projectId={id}
      projectName={projectRes.data.name}
      agentStatus={projectRes.data.agent_status ?? 'disconnected'}
      issueBadge={issueCountRes.count ?? 0}
      guidelineBadge={guidelineCountRes.count ?? 0}
    >
      {children}
    </ProjectShell>
  );
}
