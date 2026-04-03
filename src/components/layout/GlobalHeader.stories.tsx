import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from '@storybook/test';
import { GlobalHeader } from './GlobalHeader';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

const meta = {
  title: 'Layout/GlobalHeader',
  component: GlobalHeader,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof GlobalHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const IssueHeader: Story = {
  args: {
    leftContent: (
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <Badge variant="critical">Critical 2</Badge>
        <Badge variant="warning">Warning 3</Badge>
        <Badge variant="info">Info 1</Badge>
      </div>
    ),
    rightContent: (
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <span style={{ fontSize: 13, color: '#A8A29E' }}>마지막 분석: 5분 전 (세션 #12)</span>
      </div>
    ),
  },
};

export const StatusHeader: Story = {
  args: {
    leftContent: (
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: '#1C1917' }}>기획 대비 구현 현황</span>
        <div style={{ width: 120, height: 6, background: '#E7E5E4', borderRadius: 9999, overflow: 'hidden' }}>
          <div style={{ width: '65%', height: '100%', background: '#E67D22', borderRadius: 9999 }} />
        </div>
        <span style={{ fontSize: 14, fontWeight: 600, color: '#E67D22' }}>65%</span>
      </div>
    ),
    rightContent: (
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <Badge variant="implemented">구현 4</Badge>
        <Badge variant="partial">부분 2</Badge>
        <Badge variant="unimplemented">미구현 3</Badge>
        <span style={{ fontSize: 13, color: '#A8A29E' }}>마지막 분석: 3분 전</span>
        <Button size="sm" onClick={fn()}>분석 실행</Button>
      </div>
    ),
  },
};

export const ClaudeMdHeader: Story = {
  args: {
    leftContent: (
      <span style={{ fontSize: 14, fontWeight: 600, color: '#1C1917' }}>AI 가이드라인 5건</span>
    ),
    rightContent: (
      <Button variant="outline" size="sm" onClick={fn()}>전체 복사하기</Button>
    ),
  },
};

export const SessionHeader: Story = {
  args: {
    leftContent: (
      <span style={{ fontSize: 14, fontWeight: 600, color: '#1C1917' }}>전체 세션 12개</span>
    ),
    rightContent: (
      <span style={{ fontSize: 13, color: '#A8A29E' }}>최근: 2시간 전</span>
    ),
  },
};

export const Empty: Story = {
  args: {},
};
