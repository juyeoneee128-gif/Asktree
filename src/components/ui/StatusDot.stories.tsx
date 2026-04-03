import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { StatusDot } from './StatusDot';

const meta = {
  title: 'UI/StatusDot',
  component: StatusDot,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  argTypes: {
    status: {
      control: 'select',
      options: ['connected', 'disconnected', 'implemented', 'partial', 'unimplemented', 'api-disconnected'],
    },
    size: { control: { type: 'range', min: 4, max: 16, step: 1 } },
  },
  args: { status: 'connected' },
} satisfies Meta<typeof StatusDot>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Connected: Story = {
  args: { status: 'connected' },
};

export const Disconnected: Story = {
  args: { status: 'disconnected' },
};

export const Implemented: Story = {
  args: { status: 'implemented' },
};

export const Partial: Story = {
  args: { status: 'partial' },
};

export const Unimplemented: Story = {
  args: { status: 'unimplemented' },
};

export const ApiDisconnected: Story = {
  args: { status: 'api-disconnected' },
};

export const AllStatuses: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {([
        { status: 'connected', label: '에이전트 연결됨 (8px, #16A34A)' },
        { status: 'disconnected', label: '에이전트 미연결 (8px, #DC2626)' },
        { status: 'implemented', label: '구현 완료 (6px, #1E40AF)' },
        { status: 'partial', label: '부분 구현 (6px, #C2410C)' },
        { status: 'unimplemented', label: '미구현 (6px, outline #E7E5E4)' },
        { status: 'api-disconnected', label: 'API 미연결 (8px, #F97316)' },
      ] as const).map(({ status, label }) => (
        <div key={status} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <StatusDot status={status} />
          <span style={{ fontSize: 13, color: '#78716C' }}>{label}</span>
        </div>
      ))}
    </div>
  ),
};

export const CustomSize: Story = {
  args: { status: 'connected', size: 12 },
};
