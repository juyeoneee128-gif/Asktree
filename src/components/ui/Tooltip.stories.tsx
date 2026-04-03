import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Tooltip } from './Tooltip';

const meta = {
  title: 'UI/Tooltip',
  component: Tooltip,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  decorators: [(Story) => <div style={{ padding: 80 }}><Story /></div>],
  args: {
    content: '다음 코딩 세션 후 자동으로 재분석됩니다',
  },
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const PartialImplemented: Story = {
  args: {
    content: '미구현 항목은 Claude Code에 지시하세요',
  },
};

export const AttentionNeeded: Story = {
  args: {
    content: '이슈 탭에서 상세 내용을 확인하세요',
  },
};

export const Unimplemented: Story = {
  args: {
    content: '코딩을 시작하면 자동으로 감지됩니다',
  },
};

export const WithInlineText: Story = {
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ fontSize: 14, fontWeight: 600, color: '#1E40AF' }}>구현 완료</span>
      <Tooltip content="다음 코딩 세션 후 자동으로 재분석됩니다" />
    </div>
  ),
};

export const AllStatuses: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: '#1E40AF' }}>구현 완료</span>
        <Tooltip content="다음 코딩 세션 후 자동으로 재분석됩니다" />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: '#C2410C' }}>부분 구현</span>
        <Tooltip content="미구현 항목은 Claude Code에 지시하세요" />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: '#DC2626' }}>확인 필요</span>
        <Tooltip content="이슈 탭에서 상세 내용을 확인하세요" />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: '#A8A29E' }}>미구현</span>
        <Tooltip content="코딩을 시작하면 자동으로 감지됩니다" />
      </div>
    </div>
  ),
};
