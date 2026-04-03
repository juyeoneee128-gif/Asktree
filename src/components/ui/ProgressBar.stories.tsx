import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { ProgressBar } from './ProgressBar';

const meta = {
  title: 'UI/ProgressBar',
  component: ProgressBar,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  decorators: [(Story) => <div style={{ width: 320 }}><Story /></div>],
  argTypes: {
    value: { control: { type: 'range', min: 0, max: 100, step: 1 } },
    color: { control: 'color' },
  },
  args: { value: 65 },
} satisfies Meta<typeof ProgressBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Empty: Story = {
  args: { value: 0 },
};

export const Full: Story = {
  args: { value: 100 },
};

export const CustomColor: Story = {
  args: { value: 40, color: '#1E40AF' },
};

export const WithLabel: Story = {
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <span style={{ fontSize: 14, fontWeight: 600, color: '#1C1917', whiteSpace: 'nowrap' }}>
        기획 대비 구현 현황
      </span>
      <div style={{ flex: 1 }}>
        <ProgressBar value={65} />
      </div>
      <span style={{ fontSize: 14, fontWeight: 600, color: '#E67D22' }}>65%</span>
    </div>
  ),
};
