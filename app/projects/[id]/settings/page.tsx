'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Folder,
  Cpu,
  Key,
  TriangleAlert,
  RefreshCw,
  PlugZap,
  Pencil,
} from 'lucide-react';
import { GlobalHeader } from '@/src/components/layout/GlobalHeader';
import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { InputField } from '@/src/components/ui/InputField';
import { Modal } from '@/src/components/ui/Modal';
import { CodeBlock } from '@/src/components/ui/CodeBlock';
import { TextLink } from '@/src/components/ui/TextLink';
import { PageSkeleton } from '@/src/components/ui/Skeleton';
import { updateProject, deleteProject } from '@/src/lib/api/projects';
import { fetchProfile } from '@/src/lib/api/user';

interface ProjectDetailRow {
  id: string;
  name: string;
  agent_status: 'connected' | 'disconnected' | null;
  agent_last_seen: string | null;
  agent_path: string | null;
  agent_token: string | null;
  created_at: string;
}

async function fetchProjectDetail(id: string): Promise<ProjectDetailRow> {
  const res = await fetch(`/api/projects/${id}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || '프로젝트를 불러올 수 없습니다');
  }
  return res.json();
}

async function patchProjectAgentStatus(
  id: string,
  payload: { agent_status: 'connected' | 'disconnected'; agent_last_seen?: string | null; agent_path?: string | null }
): Promise<void> {
  const res = await fetch(`/api/projects/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || '에이전트 상태 변경에 실패했습니다');
  }
}

export default function ProjectSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<ProjectDetailRow | null>(null);
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 프로젝트명 수정
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameInput, setRenameInput] = useState('');
  const [renameError, setRenameError] = useState<string | null>(null);
  const [renaming, setRenaming] = useState(false);

  // 에이전트 재설치
  const [reinstallOpen, setReinstallOpen] = useState(false);

  // 에이전트 해제
  const [disconnectOpen, setDisconnectOpen] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  // 프로젝트 삭제
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([fetchProjectDetail(projectId), fetchProfile()])
      .then(([p, u]) => {
        setProject(p);
        setHasApiKey(u.has_api_key);
      })
      .catch((e) => setError(e instanceof Error ? e.message : '데이터를 불러올 수 없습니다'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const openRename = () => {
    if (!project) return;
    setRenameInput(project.name);
    setRenameError(null);
    setRenameOpen(true);
  };

  const handleRename = async () => {
    if (!project) return;
    const trimmed = renameInput.trim();
    if (!trimmed) {
      setRenameError('프로젝트명을 입력하세요');
      return;
    }
    if (trimmed === project.name) {
      setRenameOpen(false);
      return;
    }
    try {
      setRenaming(true);
      setRenameError(null);
      await updateProject(projectId, trimmed);
      setRenameOpen(false);
      load();
      router.refresh();
    } catch (e) {
      setRenameError(e instanceof Error ? e.message : '이름 변경에 실패했습니다');
    } finally {
      setRenaming(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      setDisconnecting(true);
      await patchProjectAgentStatus(projectId, {
        agent_status: 'disconnected',
        agent_last_seen: null,
        agent_path: null,
      });
      setDisconnectOpen(false);
      load();
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : '에이전트 해제에 실패했습니다');
    } finally {
      setDisconnecting(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await deleteProject(projectId);
      router.push('/projects');
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : '프로젝트 삭제에 실패했습니다');
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <>
        <GlobalHeader
          leftContent={
            <span className="text-[16px] font-semibold text-foreground">프로젝트 설정</span>
          }
        />
        <PageSkeleton />
      </>
    );
  }

  if (error || !project) {
    return (
      <>
        <GlobalHeader
          leftContent={
            <span className="text-[16px] font-semibold text-foreground">프로젝트 설정</span>
          }
        />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-[14px] text-destructive">{error ?? '프로젝트를 불러올 수 없습니다'}</p>
        </div>
      </>
    );
  }

  const agentConnected = project.agent_status === 'connected';
  const canDelete = deleteConfirm === project.name;

  return (
    <>
      <GlobalHeader
        leftContent={
          <span className="text-[16px] font-semibold text-foreground">프로젝트 설정</span>
        }
      />
      <div className="flex-1 overflow-y-auto bg-gray-50">
        <div className="max-w-[1120px] mx-auto px-8 py-10 flex flex-col gap-6">
          <div className="grid grid-cols-3 gap-5">
            {/* 프로젝트 정보 */}
            <Card padding="24px">
              <div className="flex items-center gap-2 mb-4">
                <Folder size={20} className="text-primary shrink-0" />
                <h3 className="text-[16px] font-semibold text-foreground">프로젝트 정보</h3>
              </div>
              <div className="flex flex-col gap-2 text-[14px]">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[12px] text-muted-foreground">이름</span>
                  <span className="text-foreground font-medium">{project.name}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[12px] text-muted-foreground">생성일</span>
                  <span className="text-foreground">
                    {project.created_at.slice(0, 10).replace(/-/g, '.')}
                  </span>
                </div>
              </div>
              <div className="mt-4">
                <TextLink variant="primary" fontSize={13} onClick={openRename}>
                  이름 변경 →
                </TextLink>
              </div>
            </Card>

            {/* 에이전트 연결 */}
            <Card padding="24px">
              <div className="flex items-center gap-2 mb-4">
                <Cpu size={20} className="text-primary shrink-0" />
                <h3 className="text-[16px] font-semibold text-foreground">에이전트 연결</h3>
              </div>
              <div className="flex flex-col gap-2 text-[14px]">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{
                      backgroundColor: agentConnected ? 'var(--color-success)' : '#F97316',
                    }}
                  />
                  <span className="text-foreground font-medium">
                    {agentConnected ? '연결됨' : '미연결'}
                  </span>
                </div>
                {project.agent_path && (
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[12px] text-muted-foreground">경로</span>
                    <span className="text-foreground text-[13px] truncate" title={project.agent_path}>
                      {project.agent_path}
                    </span>
                  </div>
                )}
                {project.agent_last_seen && (
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[12px] text-muted-foreground">마지막 수신</span>
                    <span className="text-foreground text-[13px]">
                      {new Date(project.agent_last_seen).toLocaleString('ko-KR')}
                    </span>
                  </div>
                )}
              </div>
              <div className="mt-4 flex gap-3">
                <TextLink variant="primary" fontSize={13} onClick={() => setReinstallOpen(true)}>
                  재설치 →
                </TextLink>
                {agentConnected && (
                  <TextLink
                    variant="destructive"
                    fontSize={13}
                    onClick={() => setDisconnectOpen(true)}
                  >
                    해제 →
                  </TextLink>
                )}
              </div>
            </Card>

            {/* API 키 */}
            <Card padding="24px">
              <div className="flex items-center gap-2 mb-4">
                <Key size={20} className="text-primary shrink-0" />
                <h3 className="text-[16px] font-semibold text-foreground">API 키</h3>
              </div>
              <div className="flex flex-col gap-1 text-[14px]">
                {hasApiKey ? (
                  <>
                    <span className="text-foreground font-medium">등록됨</span>
                    <span className="text-[12px] text-muted-foreground">
                      Anthropic API 키가 저장되어 있습니다.
                    </span>
                  </>
                ) : (
                  <>
                    <span className="font-medium" style={{ color: '#F97316' }}>
                      미등록 (대기)
                    </span>
                    <span className="text-[12px] text-muted-foreground">
                      맛보기 크레딧 소진 전에 등록하세요.
                    </span>
                  </>
                )}
              </div>
              <div className="mt-4">
                <TextLink variant="primary" fontSize={13} onClick={() => router.push('/settings/api-key')}>
                  내 설정에서 관리 →
                </TextLink>
              </div>
            </Card>
          </div>

          {/* Danger zone */}
          <div className="mt-2 pt-6 border-t border-border">
            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-col gap-0.5">
                <span className="text-[14px] font-semibold text-destructive">위험 영역</span>
                <p className="text-[13px] text-gray-400">
                  프로젝트를 삭제하면 모든 이슈·가이드라인·세션 로그가 영구 삭제됩니다.
                </p>
              </div>
              <Button
                variant="destructive-ghost"
                size="sm"
                onClick={() => {
                  setDeleteConfirm('');
                  setDeleteOpen(true);
                }}
              >
                프로젝트 삭제
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 이름 변경 모달 */}
      <Modal
        isOpen={renameOpen}
        onClose={() => !renaming && setRenameOpen(false)}
        title="프로젝트 이름 변경"
        icon={<Pencil size={20} className="text-primary" />}
        width={440}
        actions={[
          { label: '취소', variant: 'ghost', onClick: () => setRenameOpen(false) },
          {
            label: renaming ? '저장 중...' : '저장',
            variant: 'primary',
            onClick: handleRename,
          },
        ]}
      >
        <InputField
          label="새 이름"
          value={renameInput}
          onChange={(e) => setRenameInput(e.target.value)}
          error={renameError ?? undefined}
          autoFocus
        />
      </Modal>

      {/* 에이전트 재설치 모달 */}
      <Modal
        isOpen={reinstallOpen}
        onClose={() => setReinstallOpen(false)}
        title="에이전트 재설치"
        icon={<RefreshCw size={20} className="text-primary" />}
        width={560}
        actions={[{ label: '닫기', variant: 'primary', onClick: () => setReinstallOpen(false) }]}
      >
        <p className="text-[13px] text-muted-foreground leading-relaxed mb-4">
          아래 에이전트 토큰과 프로젝트 ID를 setup 스크립트에 전달하면 동일 프로젝트로 재연결됩니다.
          토큰은 외부에 노출되지 않도록 주의하세요.
        </p>

        <div className="flex flex-col gap-3">
          <div>
            <span className="text-[12px] font-medium text-muted-foreground mb-1.5 block">
              Project ID
            </span>
            <CodeBlock code={project.id} />
          </div>

          <div>
            <span className="text-[12px] font-medium text-muted-foreground mb-1.5 block">
              Agent Token
            </span>
            <CodeBlock code={project.agent_token ?? '(토큰 없음)'} />
          </div>
        </div>
      </Modal>

      {/* 에이전트 해제 모달 */}
      <Modal
        isOpen={disconnectOpen}
        onClose={() => !disconnecting && setDisconnectOpen(false)}
        title="에이전트 연결을 해제하시겠습니까?"
        icon={<PlugZap size={20} className="text-destructive" />}
        width={480}
        actions={[
          { label: '취소', variant: 'outline', onClick: () => setDisconnectOpen(false) },
          {
            label: disconnecting ? '해제 중...' : '연결 해제',
            variant: 'destructive',
            onClick: handleDisconnect,
          },
        ]}
      >
        <p className="text-[14px] text-muted-foreground leading-relaxed">
          연결이 해제되면 에이전트 push 데이터가 더 이상 수신되지 않습니다.
          토큰은 유지되므로 재설치 시 재사용할 수 있습니다.
        </p>
      </Modal>

      {/* 프로젝트 삭제 모달 */}
      <Modal
        isOpen={deleteOpen}
        onClose={() => !deleting && setDeleteOpen(false)}
        title="정말 프로젝트를 삭제하시겠습니까?"
        icon={<TriangleAlert size={20} className="text-destructive" />}
        width={480}
        actions={[
          { label: '취소', variant: 'outline', onClick: () => setDeleteOpen(false) },
          {
            label: deleting ? '삭제 중...' : '영구 삭제',
            variant: 'destructive',
            onClick: canDelete ? handleDelete : () => {},
          },
        ]}
      >
        <p className="text-[14px] text-muted-foreground leading-relaxed mb-3">
          이 프로젝트의 이슈·가이드라인·세션 로그·기획서가 함께 삭제되며 복구할 수 없습니다.
        </p>
        <p className="text-[13px] text-muted-foreground mb-2">
          계속 진행하려면 아래에 프로젝트명{' '}
          <b className="text-foreground">{project.name}</b> 을 입력하세요.
        </p>
        <InputField
          value={deleteConfirm}
          onChange={(e) => setDeleteConfirm(e.target.value)}
          placeholder={project.name}
        />
        {deleteConfirm && !canDelete && (
          <p className="text-[12px] text-destructive mt-1.5">프로젝트명이 일치하지 않습니다</p>
        )}
      </Modal>
    </>
  );
}
