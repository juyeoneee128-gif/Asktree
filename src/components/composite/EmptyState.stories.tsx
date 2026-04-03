import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from '@storybook/test';
import { Search, Shield, FileText, BarChart2 } from 'lucide-react';
import { EmptyState } from './EmptyState';

const meta = {
  title: 'Composite/EmptyState',
  component: EmptyState,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ height: 480, display: 'flex', background: '#FAFAF9' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof EmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Issues: Story = {
  args: {
    icon: <Search size={40} className="text-gray-400" />,
    title: '아직 감지된 이슈가 없습니다',
    description: '분석을 실행하면 코드 파손 여부를 자동으로 감지합니다.',
    primaryAction: { label: '분석 실행', onClick: fn() },
  },
};

export const ClaudeMd: Story = {
  args: {
    icon: <Shield size={40} className="text-gray-400" />,
    title: '아직 AI 가이드라인이 없습니다',
    description: '이슈를 확인하면 보호 규칙이 자동으로 생성됩니다. CLAUDE.md에 추가하면 AI가 해당 기능을 보호합니다.',
  },
};

export const Specs: Story = {
  args: {
    icon: <FileText size={40} className="text-gray-400" />,
    title: '아직 첨부된 기획서가 없습니다',
    description: '기획서(PRD/FRD)를 업로드하면 기능 목록을 자동으로 추출합니다.',
    primaryAction: { label: '기획서 업로드', onClick: fn() },
  },
};

export const Status: Story = {
  args: {
    icon: <BarChart2 size={40} className="text-gray-400" />,
    title: '아직 분석 결과가 없습니다',
    description: '에이전트를 연결하고 분석을 실행하면 기획 대비 구현 현황을 확인할 수 있습니다.',
    primaryAction: { label: '분석 실행', onClick: fn() },
    secondaryAction: { label: '기획서 업로드', onClick: fn() },
  },
};

export const AllResolved: Story = {
  args: {
    icon: <Search size={40} className="text-gray-400" />,
    title: '현재 감지된 문제가 없습니다',
    description: '모든 이슈가 해결되었습니다. 다음 코딩 세션 후 자동으로 재분석됩니다.',
  },
};
