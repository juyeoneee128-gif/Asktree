import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import { Folder, Wifi, Key, User, Coins } from 'lucide-react';
import { SettingsCardGrid } from './SettingsCardGrid';
import { StatusDot } from '../ui/StatusDot';

const meta = {
  title: 'Composite/SettingsCardGrid',
  component: SettingsCardGrid,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
} satisfies Meta<typeof SettingsCardGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ProjectSettings: Story = {
  args: {
    cards: [
      {
        icon: <Folder size={20} className="text-primary" />,
        title: '프로젝트 정보',
        content: (
          <div className="space-y-2">
            <div><span className="text-gray-400 text-[12px]">프로젝트명</span><br />Asktree</div>
            <div><span className="text-gray-400 text-[12px]">생성일</span><br />2026.03.28</div>
            <div><span className="text-gray-400 text-[12px]">사용 도구</span><br />Claude Code</div>
          </div>
        ),
        linkLabel: '프로젝트명 수정 →',
        onLinkClick: fn(),
      },
      {
        icon: <Wifi size={20} className="text-primary" />,
        title: '에이전트 연결',
        content: (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <StatusDot status="connected" />
              <span className="text-[14px] text-foreground">연결됨</span>
            </div>
            <div><span className="text-gray-400 text-[12px]">마지막 통신</span><br />3분 전</div>
            <div><span className="text-gray-400 text-[12px]">설치 경로</span><br />~/.asktree/agent</div>
          </div>
        ),
        linkLabel: '에이전트 재설치 →',
        onLinkClick: fn(),
      },
      {
        icon: <Key size={20} className="text-primary" />,
        title: 'API 키',
        content: (
          <div className="space-y-2">
            <div><span className="text-gray-400 text-[12px]">API 키</span><br />sk-ant-***...***</div>
            <div><span className="text-gray-400 text-[12px]">잔여 크레딧</span><br />36</div>
          </div>
        ),
        linkLabel: '관리자 설정에서 변경 →',
        onLinkClick: fn(),
      },
    ],
    dangerAction: {
      description: '프로젝트를 삭제하면 모든 분석 기록이 함께 삭제되며 복구할 수 없습니다.',
      buttonLabel: '프로젝트 삭제',
      onClick: fn(),
    },
  },
};

export const AdminSettings: Story = {
  args: {
    cards: [
      {
        icon: <User size={20} className="text-primary" />,
        title: '계정 정보',
        content: (
          <div className="space-y-2">
            <div><span className="text-gray-400 text-[12px]">이름</span><br />홍길동</div>
            <div><span className="text-gray-400 text-[12px]">이메일</span><br />user@example.com</div>
            <div><span className="text-gray-400 text-[12px]">로그인 방식</span><br />Google</div>
          </div>
        ),
        linkLabel: '프로필 수정 →',
        onLinkClick: fn(),
      },
      {
        icon: <Coins size={20} className="text-primary" />,
        title: '크레딧',
        content: (
          <div className="space-y-2">
            <div className="text-[36px] font-bold text-foreground">36</div>
            <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full" style={{ width: '36%' }} />
            </div>
            <div><span className="text-gray-400 text-[12px]">이번 달 사용량</span><br />64 크레딧</div>
          </div>
        ),
        linkLabel: '사용 내역 보기 →',
        onLinkClick: fn(),
      },
      {
        icon: <Key size={20} className="text-primary" />,
        title: 'API 키',
        content: (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <StatusDot status="api-disconnected" />
              <span className="text-[14px] text-foreground">미연결</span>
            </div>
          </div>
        ),
        linkLabel: 'API 키 설정 →',
        onLinkClick: fn(),
      },
    ],
    dangerAction: {
      description: '계정을 삭제하면 모든 프로젝트와 데이터가 영구적으로 삭제됩니다.',
      buttonLabel: '계정 삭제',
      onClick: fn(),
    },
  },
};

export const NoDangerZone: Story = {
  args: {
    cards: ProjectSettings.args!.cards!,
  },
};
