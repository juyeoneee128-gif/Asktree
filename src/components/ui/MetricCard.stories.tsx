import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { MetricCard } from './MetricCard';
import { Card } from './Card';

const meta = {
  title: 'UI/MetricCard',
  component: MetricCard,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  args: {
    label: '구현 항목',
    value: '8/10',
    subtitle: '2개 미구현',
  },
} satisfies Meta<typeof MetricCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithColor: Story = {
  args: {
    label: '감지된 이슈',
    value: '3건',
    valueColor: '#DC2626',
    subtitle: 'Critical 1 · Warning 2',
  },
};

export const ThreeColumnGrid: Story = {
  render: () => (
    <Card>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24 }}>
        <MetricCard label="구현 항목" value="8/10" subtitle="2개 미구현" />
        <MetricCard label="감지된 이슈" value="3건" valueColor="#DC2626" subtitle="Critical 1" />
        <MetricCard label="최근 변경" value="세션 #12" subtitle="2시간 전" />
      </div>
    </Card>
  ),
};
