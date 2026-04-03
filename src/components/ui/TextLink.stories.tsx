import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { TextLink } from './TextLink';

const meta = {
  title: 'UI/TextLink',
  component: TextLink,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'destructive', 'muted'],
    },
    fontSize: {
      control: 'select',
      options: [13, 14],
    },
    children: { control: 'text' },
    href: { control: 'text' },
  },
  args: {
    variant: 'primary',
    fontSize: 14,
    children: '링크 텍스트',
    href: '#',
  },
} satisfies Meta<typeof TextLink>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: { variant: 'primary', children: 'CLAUDE.md 탭에서 확인 →' },
};

export const Destructive: Story = {
  args: { variant: 'destructive', children: '계정 삭제' },
};

export const Muted: Story = {
  args: { variant: 'muted', children: '마지막 분석: 5분 전' },
};

export const FontSize13: Story = {
  args: { variant: 'primary', fontSize: 13, children: '원문 보기 →' },
};

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <TextLink variant="primary" href="#">CLAUDE.md 탭에서 확인 →</TextLink>
      <TextLink variant="destructive" href="#">계정 삭제</TextLink>
      <TextLink variant="muted" href="#">마지막 분석: 5분 전</TextLink>
      <TextLink variant="primary" fontSize={13} href="#">원문 보기 → (13px)</TextLink>
    </div>
  ),
};
