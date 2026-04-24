'use client';

import { useEffect, useState } from 'react';
import { User, TriangleAlert } from 'lucide-react';
import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { InputField } from '@/src/components/ui/InputField';
import { Modal } from '@/src/components/ui/Modal';
import { PageSkeleton } from '@/src/components/ui/Skeleton';
import {
  fetchProfile,
  updateProfile,
  deleteAccount,
  type UserProfile,
} from '@/src/lib/api/user';

export default function AccountPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);

  const load = () => {
    setLoading(true);
    fetchProfile()
      .then((p) => {
        setProfile(p);
        setName(p.name);
      })
      .catch((e) =>
        setError(e instanceof Error ? e.message : '프로필을 불러올 수 없습니다')
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const dirty = profile !== null && name.trim() !== profile.name;

  const handleSave = async () => {
    if (!dirty) return;
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError('이름을 입력하세요');
      return;
    }
    try {
      setSaving(true);
      setNameError(null);
      await updateProfile({ name: trimmed });
      load();
    } catch (e) {
      setNameError(e instanceof Error ? e.message : '저장에 실패했습니다');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await deleteAccount();
      // 계정 삭제 후 → 로그아웃 경로로 리다이렉트 (세션 쿠키 제거 + /auth/login)
      window.location.href = '/auth/logout';
    } catch (e) {
      alert(e instanceof Error ? e.message : '계정 삭제에 실패했습니다');
      setDeleting(false);
    }
  };

  const openDeleteModal = () => {
    setDeleteConfirm('');
    setDeleteOpen(true);
  };

  if (loading) {
    return <PageSkeleton />;
  }

  if (error || !profile) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-[14px] text-destructive">
          {error ?? '프로필을 불러올 수 없습니다'}
        </p>
      </div>
    );
  }

  const canDelete = deleteConfirm === profile.email;

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-[720px] mx-auto px-8 py-10 flex flex-col gap-6">
        <div className="flex items-center gap-2">
          <User size={22} className="text-primary" />
          <h1 className="text-[22px] font-bold text-foreground">계정 정보</h1>
        </div>

        <Card padding="24px" className="flex flex-col gap-5">
          <InputField
            label="이름"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={nameError ?? undefined}
          />

          <div className="flex flex-col gap-1">
            <span className="text-[13px] text-muted-foreground">이메일</span>
            <div className="flex items-center gap-2">
              <span className="text-[14px] text-foreground">{profile.email}</span>
              <span className="px-1.5 py-px rounded-full bg-muted text-[10px] font-medium text-gray-500">
                Google
              </span>
            </div>
            <span className="text-[12px] text-muted-foreground">
              Google 계정에 연동된 이메일입니다. 변경 불가.
            </span>
          </div>

          <div className="flex justify-end">
            <Button variant="primary" size="sm" onClick={handleSave} disabled={!dirty || saving}>
              {saving ? '저장 중...' : '저장'}
            </Button>
          </div>
        </Card>

        <div className="pt-6 border-t border-border">
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col gap-0.5">
              <span className="text-[14px] font-semibold text-destructive">위험 영역</span>
              <p className="text-[13px] text-gray-400">
                계정을 삭제하면 모든 프로젝트와 분석 이력이 영구 삭제됩니다.
              </p>
            </div>
            <Button variant="destructive-ghost" size="sm" onClick={openDeleteModal}>
              계정 삭제
            </Button>
          </div>
        </div>
      </div>

      <Modal
        isOpen={deleteOpen}
        onClose={() => !deleting && setDeleteOpen(false)}
        title="정말 계정을 삭제하시겠습니까?"
        icon={<TriangleAlert size={20} className="text-destructive" />}
        width={480}
        actions={[
          {
            label: '취소',
            variant: 'outline',
            onClick: () => setDeleteOpen(false),
          },
          {
            label: deleting ? '삭제 중...' : '영구 삭제',
            variant: 'destructive',
            onClick: canDelete ? handleDelete : () => {},
          },
        ]}
      >
        <p className="text-[14px] text-muted-foreground leading-relaxed mb-3">
          모든 프로젝트·이슈·가이드라인·세션 로그·API 키가 함께 삭제되며 복구할 수 없습니다.
        </p>
        <p className="text-[13px] text-muted-foreground mb-2">
          계속 진행하려면 아래에{' '}
          <b className="text-foreground">{profile.email}</b> 을 입력하세요.
        </p>
        <InputField
          value={deleteConfirm}
          onChange={(e) => setDeleteConfirm(e.target.value)}
          placeholder={profile.email}
        />
        {deleteConfirm && !canDelete && (
          <p className="text-[12px] text-destructive mt-1.5">이메일이 일치하지 않습니다</p>
        )}
      </Modal>
    </div>
  );
}
