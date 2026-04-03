import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Button } from './Button';

const meta = {
  title: 'UI/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'outline', 'ghost', 'confirm', 'destructive', 'destructive-ghost'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    disabled: { control: 'boolean' },
    children: { control: 'text' },
  },
  args: {
    children: '버튼',
    variant: 'primary',
    size: 'md',
    disabled: false,
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

/* ── Variants ── */

export const Primary: Story = {
  args: { variant: 'primary', children: 'Primary' },
};

export const Outline: Story = {
  args: { variant: 'outline', children: 'Outline' },
};

export const Ghost: Story = {
  args: { variant: 'ghost', children: 'Ghost' },
};

export const Confirm: Story = {
  args: { variant: 'confirm', children: '확인 완료' },
};

export const Destructive: Story = {
  args: { variant: 'destructive', children: '삭제' },
};

export const DestructiveGhost: Story = {
  args: { variant: 'destructive-ghost', children: '프로젝트 삭제' },
};

/* ── Sizes ── */

export const Small: Story = {
  args: { size: 'sm', children: 'Small' },
};

export const Medium: Story = {
  args: { size: 'md', children: 'Medium' },
};

export const Large: Story = {
  args: { size: 'lg', children: 'Large' },
};

/* ── States ── */

export const Disabled: Story = {
  args: { disabled: true, children: 'Disabled' },
};

/* ── All Variants Gallery ── */

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <div key={size}>
          <p style={{ marginBottom: 8, fontSize: 12, color: '#78716C', fontWeight: 600 }}>
            size: {size}
          </p>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <Button variant="primary" size={size}>Primary</Button>
            <Button variant="outline" size={size}>Outline</Button>
            <Button variant="ghost" size={size}>Ghost</Button>
            <Button variant="confirm" size={size}>확인 완료</Button>
            <Button variant="destructive" size={size}>삭제</Button>
            <Button variant="destructive-ghost" size={size}>프로젝트 삭제</Button>
          </div>
        </div>
      ))}
    </div>
  ),
};
