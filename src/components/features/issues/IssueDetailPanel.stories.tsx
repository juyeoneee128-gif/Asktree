import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { IssueDetailPanel } from './IssueDetailPanel';
import { mockIssues } from '@/src/lib/mock-data';

const meta = {
  title: 'Features/Issues/IssueDetailPanel',
  component: IssueDetailPanel,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ width: '100%', height: '100vh', background: '#FAFAF9' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof IssueDetailPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Critical: Story = {
  args: {
    issue: mockIssues.find((i) => i.level === 'critical' && i.status === 'unconfirmed') ?? null,
  },
};

export const Warning: Story = {
  args: {
    issue: mockIssues.find((i) => i.level === 'warning' && i.status === 'unconfirmed') ?? null,
  },
};

export const Confirmed: Story = {
  args: {
    issue: mockIssues.find((i) => i.status === 'confirmed') ?? null,
  },
};

export const Resolved: Story = {
  args: {
    issue: mockIssues.find((i) => i.status === 'resolved') ?? null,
  },
};

export const Redetected: Story = {
  args: {
    issue: {
      ...mockIssues[0],
      isRedetected: true,
    },
  },
};

export const Empty: Story = {
  args: {
    issue: null,
  },
};
