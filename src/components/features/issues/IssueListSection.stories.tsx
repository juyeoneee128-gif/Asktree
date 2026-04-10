import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import { IssueListSection } from './IssueListSection';
import { mockIssues } from '@/src/lib/mock-data';

const meta = {
  title: 'Features/Issues/IssueListSection',
  component: IssueListSection,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ width: 360, background: '#F5F5F4', borderRight: '1px solid #E7E5E4' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof IssueListSection>;

export default meta;
type Story = StoryObj<typeof meta>;

const unconfirmed = mockIssues.filter((i) => i.status === 'unconfirmed');
const confirmed = mockIssues.filter((i) => i.status === 'confirmed');
const resolved = mockIssues.filter((i) => i.status === 'resolved');

export const Unconfirmed: Story = {
  args: {
    title: '미확인',
    status: 'unconfirmed',
    issues: unconfirmed,
    selectedIssueId: unconfirmed[0]?.id ?? null,
    onSelectIssue: () => {},
  },
};

export const Confirmed: Story = {
  args: {
    title: '확인 완료',
    status: 'confirmed',
    issues: confirmed,
    selectedIssueId: null,
    onSelectIssue: () => {},
  },
};

export const Resolved: Story = {
  args: {
    title: '해결됨',
    status: 'resolved',
    issues: resolved,
    selectedIssueId: null,
    onSelectIssue: () => {},
  },
};

export const Empty: Story = {
  args: {
    title: '미확인',
    status: 'unconfirmed',
    issues: [],
    selectedIssueId: null,
    onSelectIssue: () => {},
  },
};

export const Interactive: Story = {
  args: {
    title: '미확인',
    status: 'unconfirmed',
    issues: unconfirmed,
    selectedIssueId: null,
    onSelectIssue: () => {},
  },
  render: (args) => {
    const [selected, setSelected] = useState<string | null>(null);
    return (
      <IssueListSection
        {...args}
        selectedIssueId={selected}
        onSelectIssue={setSelected}
      />
    );
  },
};
