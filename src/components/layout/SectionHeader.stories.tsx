'use client';

import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from '@storybook/test';
import { SectionHeader } from './SectionHeader';

const meta = {
  title: 'Layout/SectionHeader',
  component: SectionHeader,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  args: {
    title: '미확인',
    count: 4,
    isExpanded: true,
    onToggle: fn(),
  },
} satisfies Meta<typeof SectionHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Expanded: Story = {
  args: { isExpanded: true },
};

export const Collapsed: Story = {
  args: { isExpanded: false },
};

export const ZeroCount: Story = {
  args: { title: '해결됨', count: 0, isExpanded: false },
};

/* Interactive demo with toggle */
function InteractiveSections() {
  const [sections, setSections] = useState({
    unconfirmed: true,
    confirmed: false,
    resolved: false,
  });

  const toggle = (key: keyof typeof sections) => {
    setSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div style={{ width: 320, border: '1px solid var(--color-border)', borderRadius: 8, overflow: 'hidden' }}>
      <SectionHeader
        title="미확인"
        count={4}
        isExpanded={sections.unconfirmed}
        onToggle={() => toggle('unconfirmed')}
      />
      {sections.unconfirmed && (
        <div className="bg-muted">
          {['API 키 노출', '에러 처리 누락', '미호출 함수', '인증 부재'].map((item) => (
            <div key={item} className="px-5 py-2.5 border-b border-border text-[14px] text-foreground">
              {item}
            </div>
          ))}
        </div>
      )}

      <SectionHeader
        title="확인 완료"
        count={2}
        isExpanded={sections.confirmed}
        onToggle={() => toggle('confirmed')}
      />
      {sections.confirmed && (
        <div className="bg-muted">
          {['보안 헤더 누락', '로깅 미설정'].map((item) => (
            <div key={item} className="px-5 py-2.5 border-b border-border text-[14px] text-muted-foreground">
              {item}
            </div>
          ))}
        </div>
      )}

      <SectionHeader
        title="해결됨"
        count={1}
        isExpanded={sections.resolved}
        onToggle={() => toggle('resolved')}
      />
      {sections.resolved && (
        <div className="bg-muted">
          <div className="px-5 py-2.5 border-b border-border text-[14px] text-gray-400 line-through">
            환경변수 미사용
          </div>
        </div>
      )}
    </div>
  );
}

export const Interactive: Story = {
  render: () => <InteractiveSections />,
};
