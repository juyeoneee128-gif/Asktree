'use client';

import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from '@storybook/test';
import { Check, Copy } from 'lucide-react';
import { Toast } from './Toast';
import { Button } from './Button';

const meta = {
  title: 'UI/Toast',
  component: Toast,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
  args: {
    message: '복사되었습니다',
    isVisible: true,
    duration: 3000,
    onHide: fn(),
  },
} satisfies Meta<typeof Toast>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const CustomIcon: Story = {
  args: {
    message: '클립보드에 복사됨',
    icon: <Copy size={14} className="text-white" />,
  },
};

function InteractiveDemo() {
  const [visible, setVisible] = useState(false);
  return (
    <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Button onClick={() => setVisible(true)}>토스트 표시</Button>
      <Toast
        message="복사되었습니다"
        icon={<Check size={14} className="text-success" />}
        isVisible={visible}
        onHide={() => setVisible(false)}
      />
    </div>
  );
}

export const Interactive: Story = {
  render: () => <InteractiveDemo />,
  args: { isVisible: false, message: '' },
};
