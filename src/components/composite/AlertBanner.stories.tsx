import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import { AlertBanner } from './AlertBanner';

const meta = {
  title: 'Composite/AlertBanner',
  component: AlertBanner,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
  args: {
    onClose: fn(),
  },
} satisfies Meta<typeof AlertBanner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const CreditExhausted: Story = {
  args: {
    variant: 'warning',
    message: '크레딧이 소진되었습니다. 분석을 계속하려면 크레딧을 충전하거나 API 키를 연결하세요.',
    action: { label: '크레딧 충전', onClick: fn() },
  },
};

export const AgentDisconnected: Story = {
  args: {
    variant: 'error',
    message: '에이전트 연결이 끊어졌습니다. 터미널에서 에이전트를 재시작해주세요.',
    action: { label: '재연결 방법 보기', onClick: fn() },
  },
};

export const WarningNoAction: Story = {
  args: {
    variant: 'warning',
    message: '기획서가 업로드되지 않았습니다. 기획서를 업로드하면 더 정확한 분석이 가능합니다.',
  },
};

export const NoCloseButton: Story = {
  args: {
    variant: 'error',
    message: '서버 점검 중입니다. 잠시 후 다시 시도해주세요.',
    onClose: undefined,
  },
};

export const AllVariants: Story = {
  render: () => (
    <div>
      <AlertBanner
        variant="warning"
        message="크레딧이 소진되었습니다. 분석을 계속하려면 크레딧을 충전하세요."
        action={{ label: '크레딧 충전', onClick: fn() }}
        onClose={fn()}
      />
      <AlertBanner
        variant="error"
        message="에이전트 연결이 끊어졌습니다. 에이전트를 재시작해주세요."
        action={{ label: '재연결', onClick: fn() }}
        onClose={fn()}
      />
    </div>
  ),
};
