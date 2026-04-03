'use client';

import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import { Shield, Trash2, AlertTriangle } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';
import { CodeBlock } from './CodeBlock';

const meta = {
  title: 'UI/Modal',
  component: Modal,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  args: {
    isOpen: true,
    onClose: fn(),
    title: '모달 타이틀',
    width: 480,
  },
} satisfies Meta<typeof Modal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: '프로젝트를 삭제하시겠습니까?',
    icon: <Trash2 size={20} className="text-destructive" />,
    children: (
      <p className="text-[14px] text-muted-foreground">
        삭제된 프로젝트는 복구할 수 없으며, 모든 분석 기록이 함께 삭제됩니다.
      </p>
    ),
    actions: [
      { label: '취소', onClick: fn(), variant: 'ghost' },
      { label: '프로젝트 삭제', onClick: fn(), variant: 'destructive' },
    ],
  },
};

export const ClaudeMdProtection: Story = {
  args: {
    title: '이 기능을 보호할까요?',
    icon: <Shield size={20} className="text-primary" />,
    width: 520,
    children: (
      <div>
        <p className="text-[14px] text-muted-foreground mb-4">
          아래 보호 규칙을 CLAUDE.md에 추가하면, AI가 이 기능을 실수로 변경하는 것을 방지합니다.
        </p>
        <CodeBlock
          code={`# 보호 규칙: API 키 보안\n- src/config.ts의 API_KEY는 반드시 환경변수로 관리\n- 하드코딩된 API 키를 절대 커밋하지 않음`}
        />
      </div>
    ),
    actions: [
      { label: '나중에', onClick: fn(), variant: 'ghost' },
      { label: 'CLAUDE.md 탭에서 확인 →', onClick: fn(), variant: 'primary' },
    ],
  },
};

export const SessionExpired: Story = {
  args: {
    title: '세션이 만료되었습니다',
    icon: <AlertTriangle size={20} className="text-warning-orange" />,
    children: (
      <p className="text-[14px] text-muted-foreground">
        보안을 위해 세션이 만료되었습니다. 다시 로그인해주세요.
      </p>
    ),
    actions: [
      { label: '다시 로그인', onClick: fn(), variant: 'primary' },
    ],
  },
};

function InteractiveDemo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>모달 열기</Button>
      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title="프로젝트명 수정"
        actions={[
          { label: '취소', onClick: () => setOpen(false), variant: 'ghost' },
          { label: '저장', onClick: () => setOpen(false), variant: 'primary' },
        ]}
      >
        <div>
          <label className="text-[13px] text-muted-foreground block mb-2">프로젝트명</label>
          <input
            type="text"
            defaultValue="Asktree"
            className="w-full px-4 py-3 border border-border rounded-lg text-[14px] text-foreground focus:border-primary focus:outline-none"
          />
        </div>
      </Modal>
    </>
  );
}

export const Interactive: Story = {
  render: () => <InteractiveDemo />,
  args: { isOpen: false, children: null, title: '' },
};
