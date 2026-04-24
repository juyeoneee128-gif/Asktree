'use client';

import { useEffect, useState } from 'react';
import { Key, TriangleAlert } from 'lucide-react';
import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { InputField } from '@/src/components/ui/InputField';
import { Modal } from '@/src/components/ui/Modal';
import { PageSkeleton } from '@/src/components/ui/Skeleton';
import {
  fetchApiKeyStatus,
  saveApiKey,
  deleteApiKey,
  type ApiKeyStatus,
} from '@/src/lib/api/user';

export default function ApiKeyPage() {
  const [status, setStatus] = useState<ApiKeyStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 저장/변경 입력 상태
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState('');
  const [inputError, setInputError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // 삭제 확인 모달
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = () => {
    setLoading(true);
    fetchApiKeyStatus()
      .then(setStatus)
      .catch((e) =>
        setError(e instanceof Error ? e.message : 'API 키 상태를 불러올 수 없습니다')
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const startEdit = () => {
    setInput('');
    setInputError(null);
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setInput('');
    setInputError(null);
  };

  const handleSave = async () => {
    const trimmed = input.trim();
    if (!trimmed) {
      setInputError('API 키를 입력하세요');
      return;
    }
    if (!trimmed.startsWith('sk-ant-')) {
      setInputError('Anthropic API 키 형식이 아닙니다 (sk-ant- 접두사 필요)');
      return;
    }
    try {
      setSubmitting(true);
      setInputError(null);
      await saveApiKey(trimmed);
      setEditing(false);
      setInput('');
      load();
    } catch (e) {
      setInputError(e instanceof Error ? e.message : 'API 키 저장에 실패했습니다');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await deleteApiKey();
      setDeleteOpen(false);
      load();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'API 키 삭제에 실패했습니다');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <PageSkeleton />;
  }

  if (error || !status) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-[14px] text-destructive">
          {error ?? 'API 키 상태를 불러올 수 없습니다'}
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-[720px] mx-auto px-8 py-10 flex flex-col gap-6">
        <div className="flex items-center gap-2">
          <Key size={22} className="text-primary" />
          <h1 className="text-[22px] font-bold text-foreground">API 키</h1>
        </div>

        <p className="text-[13px] text-muted-foreground leading-relaxed">
          본인의 Anthropic API 키를 등록하면 맛보기 크레딧 소진 이후에도 분석 기능을 계속 이용할 수 있습니다.
          키는 AES-256으로 암호화되어 저장되며, 저장 후 원본은 표시되지 않습니다.
        </p>

        <Card padding="24px" className="flex flex-col gap-4">
          {!editing && status.has_key && (
            <>
              <div className="flex flex-col gap-1">
                <span className="text-[12px] text-muted-foreground">등록된 키</span>
                <span
                  className="text-[14px] text-foreground"
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  {status.masked_key ?? 'sk-ant-***...***'}
                </span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={startEdit}>
                  변경
                </Button>
                <Button
                  variant="destructive-ghost"
                  size="sm"
                  onClick={() => setDeleteOpen(true)}
                >
                  삭제
                </Button>
              </div>
            </>
          )}

          {!editing && !status.has_key && (
            <>
              <div className="flex flex-col gap-1">
                <span className="text-[12px] text-muted-foreground">상태</span>
                <span className="text-[14px] font-semibold" style={{ color: '#F97316' }}>
                  미등록 (대기)
                </span>
              </div>
              <Button variant="primary" size="sm" className="self-start" onClick={startEdit}>
                API 키 등록
              </Button>
            </>
          )}

          {editing && (
            <>
              <InputField
                label="Anthropic API 키"
                type="password"
                placeholder="sk-ant-..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                error={inputError ?? undefined}
                autoFocus
              />
              <div className="flex gap-2 justify-end">
                <Button variant="ghost" size="sm" onClick={cancelEdit} disabled={submitting}>
                  취소
                </Button>
                <Button variant="primary" size="sm" onClick={handleSave} disabled={submitting}>
                  {submitting ? '저장 중...' : '저장'}
                </Button>
              </div>
            </>
          )}
        </Card>

        <p className="text-[12px] text-muted-foreground">
          ※ API 키는{' '}
          <a
            href="https://console.anthropic.com/settings/keys"
            target="_blank"
            rel="noreferrer"
            className="text-primary hover:underline"
          >
            Anthropic Console
          </a>
          에서 발급받을 수 있습니다.
        </p>
      </div>

      <Modal
        isOpen={deleteOpen}
        onClose={() => !deleting && setDeleteOpen(false)}
        title="API 키를 삭제하시겠습니까?"
        icon={<TriangleAlert size={20} className="text-destructive" />}
        width={440}
        actions={[
          {
            label: '취소',
            variant: 'outline',
            onClick: () => setDeleteOpen(false),
          },
          {
            label: deleting ? '삭제 중...' : '삭제',
            variant: 'destructive',
            onClick: handleDelete,
          },
        ]}
      >
        <p className="text-[14px] text-muted-foreground leading-relaxed">
          등록된 API 키가 삭제됩니다. 이후 크레딧 소진 시 분석 기능을 사용할 수 없습니다.
        </p>
      </Modal>
    </div>
  );
}
