import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Badge } from './Badge';

const meta = {
  title: 'UI/Badge',
  component: Badge,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: [
        'critical', 'warning', 'info',
        'implemented', 'partial', 'unimplemented', 'attention',
        'sidebar',
      ],
    },
    children: { control: 'text' },
  },
  args: {
    variant: 'info',
    children: 'Info',
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

/* ── Issue Level ── */

export const Critical: Story = {
  args: { variant: 'critical', children: 'Critical' },
};

export const Warning: Story = {
  args: { variant: 'warning', children: 'Warning' },
};

export const Info: Story = {
  args: { variant: 'info', children: 'Info' },
};

/* ── Implementation Status ── */

export const Implemented: Story = {
  args: { variant: 'implemented', children: '구현완료' },
};

export const Partial: Story = {
  args: { variant: 'partial', children: '부분구현' },
};

export const Unimplemented: Story = {
  args: { variant: 'unimplemented', children: '미구현' },
};

export const Attention: Story = {
  args: { variant: 'attention', children: '확인필요' },
};

/* ── Sidebar Count ── */

export const SidebarCount: Story = {
  args: { variant: 'sidebar', children: '3' },
};

/* ── All Variants Gallery ── */

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <p style={{ marginBottom: 8, fontSize: 12, color: '#78716C', fontWeight: 600 }}>
          Issue Level
        </p>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Badge variant="critical">Critical</Badge>
          <Badge variant="warning">Warning</Badge>
          <Badge variant="info">Info</Badge>
        </div>
      </div>
      <div>
        <p style={{ marginBottom: 8, fontSize: 12, color: '#78716C', fontWeight: 600 }}>
          Implementation Status
        </p>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Badge variant="implemented">구현완료</Badge>
          <Badge variant="partial">부분구현</Badge>
          <Badge variant="unimplemented">미구현</Badge>
          <Badge variant="attention">확인필요</Badge>
        </div>
      </div>
      <div>
        <p style={{ marginBottom: 8, fontSize: 12, color: '#78716C', fontWeight: 600 }}>
          Sidebar Count (20x20 circle)
        </p>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Badge variant="sidebar">3</Badge>
          <Badge variant="sidebar">12</Badge>
        </div>
      </div>
    </div>
  ),
};
