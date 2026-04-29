import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { InputField } from './InputField';

const meta = {
  title: 'UI/InputField',
  component: InputField,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  decorators: [(Story) => <div style={{ width: 360 }}><Story /></div>],
  argTypes: {
    type: { control: 'select', options: ['text', 'password'] },
  },
  args: {
    label: '프로젝트명',
    placeholder: '프로젝트 이름을 입력하세요',
    type: 'text',
  },
} satisfies Meta<typeof InputField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithValue: Story = {
  args: {
    label: '프로젝트명',
    defaultValue: 'CodeSasu',
  },
};

export const Password: Story = {
  args: {
    label: 'API 키',
    type: 'password',
    placeholder: 'sk-ant-...',
  },
};

export const WithError: Story = {
  args: {
    label: '프로젝트명',
    defaultValue: '',
    error: '프로젝트명을 입력해주세요',
  },
};

export const NoLabel: Story = {
  args: {
    label: undefined,
    placeholder: '검색어를 입력하세요',
  },
};
