import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from '@storybook/test';
import { FixBox } from './FixBox';

const meta = {
  title: 'UI/FixBox',
  component: FixBox,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  decorators: [(Story) => <div style={{ width: 520 }}><Story /></div>],
  args: {
    onCopy: fn(),
  },
} satisfies Meta<typeof FixBox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SingleLine: Story = {
  args: {
    command: 'src/config.ts 파일에서 하드코딩된 API 키를 환경변수(process.env.API_KEY)로 교체해줘.',
  },
};

export const MultiLine: Story = {
  args: {
    command: `src/api/auth.ts 파일의 loginUser 함수에 try-catch를 추가해줘.
catch 블록에서 에러를 콘솔에 출력하고, 사용자에게 "로그인에 실패했습니다" 메시지를 보여줘.
기존 로직은 변경하지 마.`,
  },
};

export const LongCommand: Story = {
  args: {
    command: 'src/utils/format.ts에서 formatCurrency 함수가 호출되지 않고 있어. 이 함수가 실제로 필요한지 확인하고, 불필요하면 삭제해줘. 삭제 전에 다른 파일에서 import하고 있는지 먼저 확인해줘.',
  },
};
