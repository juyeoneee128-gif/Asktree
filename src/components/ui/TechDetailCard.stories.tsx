import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { TechDetailCard } from './TechDetailCard';

const meta = {
  title: 'UI/TechDetailCard',
  component: TechDetailCard,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  decorators: [(Story) => <div style={{ width: 520 }}><Story /></div>],
} satisfies Meta<typeof TechDetailCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    file: 'src/config.ts',
    basis: 'API 키 하드코딩 패턴 감지',
    time: '2분 전',
  },
};

export const SessionBased: Story = {
  args: {
    file: 'src/api/auth.ts:42',
    basis: '세션 #12 대비 함수 삭제',
    time: '1시간 전',
  },
};
