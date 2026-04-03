import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { MasterDetailLayout } from './MasterDetailLayout';
import { SectionHeader } from './SectionHeader';

const meta = {
  title: 'Layout/MasterDetailLayout',
  component: MasterDetailLayout,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ height: '600px', display: 'flex' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof MasterDetailLayout>;

export default meta;
type Story = StoryObj<typeof meta>;

const SampleListItem = ({ title, subtitle, active }: { title: string; subtitle: string; active?: boolean }) => (
  <div
    className={[
      'px-5 py-3 border-b border-border cursor-pointer transition-colors',
      active ? 'bg-background' : 'hover:bg-gray-50',
    ].join(' ')}
    style={active ? { borderLeft: '3px solid var(--color-primary)' } : undefined}
  >
    <div className="text-[14px] font-semibold text-foreground">{title}</div>
    <div className="text-[12px] text-gray-400 mt-0.5">{subtitle}</div>
  </div>
);

export const Default: Story = {
  args: {
    listContent: (
      <div>
        <SectionHeader title="미확인" count={3} isExpanded onToggle={() => {}} />
        <SampleListItem title="API 키가 코드에 노출됨" subtitle="src/config.ts" active />
        <SampleListItem title="에러 처리 누락" subtitle="src/api/auth.ts" />
        <SampleListItem title="미호출 함수 존재" subtitle="src/utils/format.ts" />
        <SectionHeader title="확인 완료" count={2} isExpanded={false} onToggle={() => {}} />
        <SectionHeader title="해결됨" count={1} isExpanded={false} onToggle={() => {}} />
      </div>
    ),
    detailContent: (
      <div className="p-6">
        <h2 className="text-[24px] font-bold text-foreground mb-4">API 키가 코드에 노출됨</h2>
        <p className="text-[14px] text-muted-foreground">src/config.ts · 보안</p>
        <div className="mt-6 p-4 bg-card rounded-xl border border-border" style={{ borderLeft: '3px solid var(--color-critical)' }}>
          <p className="text-[14px] text-foreground">
            소스 코드에 API 키가 하드코딩되어 있습니다. 이 키가 Git에 커밋되면 외부에 노출될 수 있습니다.
          </p>
        </div>
      </div>
    ),
  },
};

export const EmptyState: Story = {
  args: {
    listContent: (
      <div>
        <SectionHeader title="미확인" count={0} isExpanded={false} onToggle={() => {}} />
        <SectionHeader title="확인 완료" count={0} isExpanded={false} onToggle={() => {}} />
        <SectionHeader title="해결됨" count={0} isExpanded={false} onToggle={() => {}} />
      </div>
    ),
    detailContent: (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <p className="text-[20px] font-semibold text-foreground">아직 감지된 이슈가 없습니다</p>
        <p className="text-[14px] text-muted-foreground mt-2">분석을 실행하면 이슈가 여기에 표시됩니다.</p>
      </div>
    ),
  },
};

export const CustomWidth: Story = {
  args: {
    ...Default.args,
    listWidth: '40%',
  },
};
