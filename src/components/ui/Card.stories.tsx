import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Card } from './Card';

const meta = {
  title: 'UI/Card',
  component: Card,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'select', options: ['default', 'danger'] },
    hasBorder: { control: 'boolean' },
    padding: { control: 'text' },
  },
  args: {
    variant: 'default',
    hasBorder: true,
    padding: '20px',
  },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: (
      <div>
        <p style={{ fontSize: 14, fontWeight: 600, color: '#1C1917' }}>카드 제목</p>
        <p style={{ fontSize: 13, color: '#78716C', marginTop: 4 }}>카드 설명 텍스트가 여기에 들어갑니다.</p>
      </div>
    ),
  },
};

export const Danger: Story = {
  args: {
    variant: 'danger',
    children: (
      <div>
        <p style={{ fontSize: 14, fontWeight: 600, color: '#DC2626' }}>확인 필요</p>
        <p style={{ fontSize: 13, color: '#78716C', marginTop: 4 }}>이슈 탭에서 상세 내용을 확인하세요.</p>
      </div>
    ),
  },
};

export const NoBorder: Story = {
  args: {
    hasBorder: false,
    children: <p style={{ fontSize: 14, color: '#1C1917' }}>테두리 없는 카드</p>,
  },
};

export const CustomPadding: Story = {
  args: {
    padding: '32px',
    children: <p style={{ fontSize: 14, color: '#1C1917' }}>32px 패딩 카드</p>,
  },
};
