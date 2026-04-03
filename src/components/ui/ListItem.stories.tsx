import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from '@storybook/test';
import { ListItem } from './ListItem';

const meta = {
  title: 'UI/ListItem',
  component: ListItem,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ width: 320, border: '1px solid var(--color-border)', borderRadius: 8, overflow: 'hidden' }}>
        <Story />
      </div>
    ),
  ],
  args: {
    title: 'API 키가 코드에 노출됨',
    subtitle: 'src/config.ts · 보안',
    onClick: fn(),
  },
} satisfies Meta<typeof ListItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ActiveSelected: Story = {
  args: {
    isSelected: true,
    status: 'active',
    badge: { label: 'Critical', variant: 'critical' },
    accentColor: '#DC2626',
  },
};

export const ActiveUnselected: Story = {
  args: {
    status: 'active',
    badge: { label: 'Warning', variant: 'warning' },
  },
};

export const Confirmed: Story = {
  args: {
    status: 'confirmed',
    title: '보안 헤더 누락',
    subtitle: 'src/middleware.ts',
  },
};

export const Resolved: Story = {
  args: {
    status: 'resolved',
    title: '환경변수 미사용',
    subtitle: 'src/config.ts',
  },
};

export const AllStates: Story = {
  render: () => (
    <div>
      <ListItem
        title="API 키가 코드에 노출됨"
        subtitle="src/config.ts · 보안"
        badge={{ label: 'Critical', variant: 'critical' }}
        isSelected
        accentColor="#DC2626"
        onClick={fn()}
      />
      <ListItem
        title="에러 처리 누락"
        subtitle="src/api/auth.ts · 안정성"
        badge={{ label: 'Warning', variant: 'warning' }}
        onClick={fn()}
      />
      <ListItem
        title="미호출 함수 존재"
        subtitle="src/utils/format.ts · 품질"
        badge={{ label: 'Info', variant: 'info' }}
        onClick={fn()}
      />
      <ListItem
        title="보안 헤더 누락"
        subtitle="src/middleware.ts"
        status="confirmed"
        onClick={fn()}
      />
      <ListItem
        title="환경변수 미사용"
        subtitle="src/config.ts"
        status="resolved"
        onClick={fn()}
      />
    </div>
  ),
};
