'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { CodeBlock } from '@/src/components/ui/CodeBlock';
import { Stepper } from '@/src/components/ui/Stepper';
import { createSpecDocument } from '@/src/lib/api/specs';
import type { SpecDocType } from '@/src/lib/mock-data';

interface OnboardingProject {
  id: string;
  name: string;
  agent_token: string | null;
  agent_status: 'connected' | 'disconnected' | null;
}

// 에이전트가 설치되면 ~/.claude/projects/ 감시가 자동으로 시작되므로
// 별도 "폴더 연동" 단계는 생략하고 설치 → 기획서 업로드 2단계로 구성
const stepLabels = [
  { label: '에이전트 설치' },
  { label: '기획서 (선택)' },
];

function OnboardingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const projectId = searchParams.get('projectId');

  const [project, setProject] = useState<OnboardingProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<1 | 2>(1);

  // Step 1 connection check state
  const [connectionStatus, setConnectionStatus] = useState<
    'idle' | 'checking' | 'connected' | 'disconnected'
  >('idle');
  const [connectionMessage, setConnectionMessage] = useState<string | null>(null);

  // Step 3 form state
  const [docName, setDocName] = useState('');
  const [docType, setDocType] = useState<SpecDocType>('PRD');
  const [docContent, setDocContent] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) {
      router.replace('/projects');
      return;
    }
    fetch(`/api/projects/${projectId}`)
      .then(async (res) => {
        if (!res.ok) throw new Error('프로젝트를 불러올 수 없습니다');
        return res.json();
      })
      .then((data) => {
        setProject({
          id: data.id,
          name: data.name,
          agent_token: data.agent_token,
          agent_status: data.agent_status,
        });
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : '프로젝트를 불러올 수 없습니다');
      })
      .finally(() => setLoading(false));
  }, [projectId, router]);

  if (loading) {
    return <p className="text-[14px] text-muted-foreground">로딩 중...</p>;
  }

  if (error || !project) {
    return (
      <div className="flex flex-col items-center gap-4">
        <p className="text-[14px] text-destructive">
          {error ?? '프로젝트를 불러올 수 없습니다'}
        </p>
        <Button variant="outline" onClick={() => router.push('/projects')}>
          프로젝트 목록으로
        </Button>
      </div>
    );
  }

  const handleNext = () => setStep(2);
  const handlePrev = () => setStep(1);
  const handleComplete = () => router.push(`/projects/${project.id}/status`);

  const handleCheckConnection = async () => {
    setConnectionStatus('checking');
    setConnectionMessage(null);
    try {
      const res = await fetch(`/api/projects/${project.id}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('프로젝트 상태를 확인할 수 없습니다');
      const data = await res.json();
      const agentStatus: 'connected' | 'disconnected' | null = data.agent_status ?? null;
      setProject((prev) => (prev ? { ...prev, agent_status: agentStatus } : prev));
      if (agentStatus === 'connected') {
        setConnectionStatus('connected');
      } else {
        setConnectionStatus('disconnected');
        setConnectionMessage(
          '아직 연결되지 않았습니다. 설치 명령을 실행했는지 확인해주세요.'
        );
      }
    } catch (e) {
      setConnectionStatus('disconnected');
      setConnectionMessage(
        e instanceof Error ? e.message : '연결 확인 중 오류가 발생했습니다'
      );
    }
  };

  const canUpload = docName.trim().length > 0 && docContent.trim().length > 0;

  const handleUploadAndComplete = async () => {
    if (!canUpload) return;
    try {
      setUploading(true);
      setUploadError(null);
      await createSpecDocument(project.id, {
        name: docName.trim(),
        type: docType,
        content: docContent.trim(),
      });
      router.push(`/projects/${project.id}/status`);
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : '업로드에 실패했습니다');
      setUploading(false);
    }
  };

  return (
    <div className="w-full flex flex-col gap-8">
      <div className="flex flex-col items-center gap-2">
        <Stepper steps={stepLabels} currentStep={step - 1} />
        <p className="text-[12px] text-muted-foreground mt-2">
          프로젝트 <span className="font-semibold text-foreground">{project.name}</span> 설정 중
        </p>
      </div>

      <Card padding="32px" className="w-full">
        {step === 1 &&
          (connectionStatus === 'connected' ? (
            <Step1Success projectName={project.name} />
          ) : (
            <Step1Content
              project={project}
              connectionStatus={connectionStatus}
              connectionMessage={connectionMessage}
            />
          ))}
        {step === 2 && (
          <SpecUploadForm
            name={docName}
            type={docType}
            content={docContent}
            onNameChange={setDocName}
            onTypeChange={setDocType}
            onContentChange={setDocContent}
            error={uploadError}
          />
        )}
      </Card>

      {/* Navigation */}
      <div className="w-full flex items-center justify-between">
        <div>
          {step > 1 && (
            <Button variant="ghost" onClick={handlePrev} disabled={uploading}>
              ← 이전
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          {step === 1 && (
            <>
              <Button variant="ghost" onClick={handleNext}>
                건너뛰기
              </Button>
              {connectionStatus === 'connected' ? (
                <Button variant="primary" onClick={handleNext}>
                  다음: 기획서 업로드 →
                </Button>
              ) : connectionStatus === 'disconnected' ? (
                <Button variant="primary" onClick={handleCheckConnection}>
                  다시 확인
                </Button>
              ) : (
                <Button
                  variant="primary"
                  onClick={handleCheckConnection}
                  disabled={connectionStatus === 'checking'}
                >
                  {connectionStatus === 'checking' ? '확인 중...' : '연결 확인'}
                </Button>
              )}
            </>
          )}
          {step === 2 && (
            <>
              <Button variant="ghost" onClick={handleComplete} disabled={uploading}>
                건너뛰기
              </Button>
              <Button
                variant="primary"
                onClick={handleUploadAndComplete}
                disabled={!canUpload || uploading}
              >
                {uploading ? '업로드 중...' : '업로드하고 완료'}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Step 1 ───

function Step1Content({
  project,
  connectionStatus,
  connectionMessage,
}: {
  project: OnboardingProject;
  connectionStatus: 'idle' | 'checking' | 'connected' | 'disconnected';
  connectionMessage: string | null;
}) {
  const installCmd = `curl -fsSL https://codesasu.app/install.sh | \\
  CODESASU_PROJECT_ID=${project.id} \\
  CODESASU_AGENT_TOKEN=${project.agent_token ?? '<TOKEN>'} \\
  bash`;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-[18px] font-bold text-foreground">1. 에이전트 설치</h2>
        <p className="text-[13px] text-muted-foreground mt-1 leading-relaxed">
          로컬에서 Claude Code 세션 데이터를 수집해 분석 서버로 전송하는 에이전트입니다.
          터미널에 아래 명령어를 붙여넣어 설치하세요.
        </p>
      </div>

      <div>
        <span className="text-[12px] font-medium text-muted-foreground mb-1.5 block">
          설치 명령
        </span>
        <CodeBlock code={installCmd} />
      </div>

      <div className="grid grid-cols-2 gap-3">
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

      {connectionStatus === 'disconnected' && connectionMessage && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-[#FEF2F2] border border-[#FCA5A5]">
          <span className="text-[14px] text-destructive leading-relaxed">
            {connectionMessage}
          </span>
        </div>
      )}

      <p className="text-[12px] text-gray-400 leading-relaxed">
        ※ 코드 원문은 Ephemeral Processing으로 처리되어 분석 후 즉시 파기됩니다.
        Git에 커밋된 코드 외 정보는 서버에 영구 저장되지 않습니다.
      </p>
    </div>
  );
}

function Step1Success({ projectName }: { projectName: string }) {
  return (
    <div className="flex flex-col items-center gap-6 py-8">
      <div
        className="text-primary leading-none"
        style={{ fontSize: 60, fontWeight: 400 }}
        aria-hidden
      >
        ✓
      </div>
      <h2 className="text-[24px] font-bold text-foreground text-center">
        에이전트 연결 성공!
      </h2>
      <p className="text-[14px] text-muted-foreground text-center leading-relaxed">
        <span className="font-semibold text-foreground">{projectName}</span> 프로젝트와
        연결되었습니다.
      </p>
    </div>
  );
}

// ─── Step 2 (기획서 업로드) ───

function SpecUploadForm({
  name,
  type,
  content,
  onNameChange,
  onTypeChange,
  onContentChange,
  error,
}: {
  name: string;
  type: SpecDocType;
  content: string;
  onNameChange: (v: string) => void;
  onTypeChange: (v: SpecDocType) => void;
  onContentChange: (v: string) => void;
  error: string | null;
}) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-[18px] font-bold text-foreground">2. 기획서 업로드 (선택)</h2>
        <p className="text-[13px] text-muted-foreground mt-1 leading-relaxed">
          기획서를 업로드하면 AI가 기능 목록을 추출해 [현황] 탭에서 구현 상태를 추적합니다.
          나중에 추가할 수도 있으니 지금 건너뛰어도 됩니다.
        </p>
      </div>

      <div className="flex gap-3">
        <div className="flex-1 flex flex-col gap-1.5">
          <label className="text-[12px] font-medium text-muted-foreground">문서명</label>
          <input
            type="text"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="예: MyProject_PRD_v1.0.md"
            className="w-full h-10 px-3 rounded-lg border border-border bg-background text-[14px] text-foreground focus:outline-none focus:border-primary"
          />
        </div>
        <div className="flex flex-col gap-1.5" style={{ width: 120 }}>
          <label className="text-[12px] font-medium text-muted-foreground">유형</label>
          <select
            value={type}
            onChange={(e) => onTypeChange(e.target.value as SpecDocType)}
            className="w-full h-10 px-3 rounded-lg border border-border bg-background text-[14px] text-foreground focus:outline-none focus:border-primary cursor-pointer"
          >
            <option value="PRD">PRD</option>
            <option value="FRD">FRD</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-[12px] font-medium text-muted-foreground">본문 내용</label>
        <textarea
          value={content}
          onChange={(e) => onContentChange(e.target.value)}
          placeholder="기획서 내용을 복사해서 여기에 붙여넣으세요..."
          rows={10}
          className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-[13px] text-foreground focus:outline-none focus:border-primary resize-none"
          style={{ fontFamily: 'var(--font-mono)', lineHeight: 1.6 }}
        />
      </div>

      <p className="text-[12px] text-gray-400 leading-relaxed">
        ※ 업로드 시 Claude API가 호출되며 1 크레딧이 차감됩니다. 기능 추출에는 10~30초 소요됩니다.
      </p>

      {error && <p className="text-[13px] text-destructive">{error}</p>}
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={<p className="text-[14px] text-muted-foreground">로딩 중...</p>}
    >
      <OnboardingContent />
    </Suspense>
  );
}
