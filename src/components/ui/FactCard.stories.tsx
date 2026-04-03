import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { FactCard } from './FactCard';

const meta = {
  title: 'UI/FactCard',
  component: FactCard,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  argTypes: {
    level: { control: 'select', options: ['critical', 'warning', 'info'] },
  },
  args: { level: 'critical' },
  decorators: [(Story) => <div style={{ width: 480 }}><Story /></div>],
} satisfies Meta<typeof FactCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Critical: Story = {
  args: {
    level: 'critical',
    children: '소스 코드에 API 키가 하드코딩되어 있습니다. 이 키가 Git에 커밋되면 외부에 노출될 수 있습니다.',
  },
};

export const Warning: Story = {
  args: {
    level: 'warning',
    children: 'API 호출 시 에러 처리가 누락되어 있어, 서버 오류 시 사용자에게 빈 화면이 표시될 수 있습니다.',
  },
};

export const Info: Story = {
  args: {
    level: 'info',
    children: 'formatCurrency 함수가 정의되어 있지만 어디서도 호출되지 않습니다. 의도된 것인지 확인이 필요합니다.',
  },
};

export const AllLevels: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <FactCard level="critical">
        소스 코드에 API 키가 하드코딩되어 있습니다.
      </FactCard>
      <FactCard level="warning">
        API 호출 시 에러 처리가 누락되어 있습니다.
      </FactCard>
      <FactCard level="info">
        formatCurrency 함수가 어디서도 호출되지 않습니다.
      </FactCard>
    </div>
  ),
};
