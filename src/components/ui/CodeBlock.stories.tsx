import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import { CodeBlock } from './CodeBlock';

const meta = {
  title: 'UI/CodeBlock',
  component: CodeBlock,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  decorators: [(Story) => <div style={{ width: 520 }}><Story /></div>],
  args: {
    showCopyButton: true,
    onCopy: fn(),
  },
} satisfies Meta<typeof CodeBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ClaudeMdRule: Story = {
  args: {
    code: `# 보호 규칙: API 키 보안
- src/config.ts의 API_KEY는 반드시 환경변수로 관리
- 하드코딩된 API 키를 절대 커밋하지 않음
- .env 파일은 .gitignore에 포함`,
  },
};

export const ShellCommand: Story = {
  args: {
    code: 'curl -fsSL https://codesasu.io/install.sh | sh',
  },
};

export const MultiLineCode: Story = {
  args: {
    code: `export async function loginUser(email: string, password: string) {
  try {
    const response = await auth.signInWithPassword({ email, password });
    return response.data;
  } catch (error) {
    console.error('Login failed:', error);
    throw new Error('로그인에 실패했습니다');
  }
}`,
  },
};

export const NoCopyButton: Story = {
  args: {
    code: '# 이 코드 블록은 복사 버튼이 없습니다',
    showCopyButton: false,
  },
};
