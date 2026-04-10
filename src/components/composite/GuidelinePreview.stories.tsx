import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { GuidelinePreview } from './GuidelinePreview';

const meta = {
  title: 'Composite/GuidelinePreview',
  component: GuidelinePreview,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ width: 460, padding: 24, background: '#FFFFFF' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof GuidelinePreview>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    rule: 'src/config.ts에 API 키, 시크릿, 토큰을 절대 하드코딩하지 마라. 반드시 환경변수(process.env)를 사용해라.',
  },
};

export const Multiline: Story = {
  args: {
    rule: '# 보호 규칙: API 키 보안\n- src/config.ts의 API_KEY는 반드시 환경변수로 관리\n- 하드코딩된 API 키를 절대 커밋하지 않음\n- .env 파일은 .gitignore에 포함',
  },
};

export const CustomHint: Story = {
  args: {
    rule: '대시보드 권한 확인 기능을 임의로 삭제하지 마라.',
    hint: '복사 후 CLAUDE.md 최상단에 추가하세요.',
  },
};
