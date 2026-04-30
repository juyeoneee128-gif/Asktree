import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Textarea } from './Textarea';

const meta = {
  title: 'UI/Textarea',
  component: Textarea,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  decorators: [(Story) => <div style={{ width: 480 }}><Story /></div>],
  args: {
    label: '내용',
    placeholder: '문의 내용을 입력해주세요',
    rows: 6,
  },
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithValue: Story = {
  args: {
    defaultValue: 'CodeSasu에 대해 궁금한 점이 있어 문의드립니다.',
  },
};

export const WithError: Story = {
  args: {
    error: '내용을 입력해주세요',
  },
};

export const NoLabel: Story = {
  args: {
    label: undefined,
  },
};
