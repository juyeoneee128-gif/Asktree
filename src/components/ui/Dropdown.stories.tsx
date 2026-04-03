'use client';

import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from '@storybook/test';
import { RefreshCw, Trash2, Edit2, MoreVertical } from 'lucide-react';
import { Dropdown } from './Dropdown';
import { Button } from './Button';

const meta = {
  title: 'UI/Dropdown',
  component: Dropdown,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  args: {
    isOpen: true,
    onClose: fn(),
  },
} satisfies Meta<typeof Dropdown>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DocumentActions: Story = {
  args: {
    items: [
      { icon: <RefreshCw size={14} />, label: '문서 교체', onClick: fn() },
      { icon: <Trash2 size={14} />, label: '문서 삭제', onClick: fn(), variant: 'danger' },
    ],
  },
};

export const ProjectActions: Story = {
  args: {
    items: [
      { icon: <Edit2 size={14} />, label: '프로젝트명 변경', onClick: fn() },
      { icon: <Trash2 size={14} />, label: '프로젝트 삭제', onClick: fn(), variant: 'danger' },
    ],
  },
};

function InteractiveDemo() {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <Button variant="ghost" size="sm" onClick={() => setOpen(!open)}>
        <MoreVertical size={16} />
      </Button>
      <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 4 }}>
        <Dropdown
          isOpen={open}
          onClose={() => setOpen(false)}
          items={[
            { icon: <RefreshCw size={14} />, label: '문서 교체', onClick: () => alert('교체') },
            { icon: <Trash2 size={14} />, label: '문서 삭제', onClick: () => alert('삭제'), variant: 'danger' },
          ]}
        />
      </div>
    </div>
  );
}

export const Interactive: Story = {
  render: () => <InteractiveDemo />,
  args: { isOpen: false, items: [] },
};
