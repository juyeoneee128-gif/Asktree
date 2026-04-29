import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { ProjectCard } from './ProjectCard';

const meta = {
  title: 'Features/Home/ProjectCard',
  component: ProjectCard,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ width: 320 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ProjectCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Connected: Story = {
  args: {
    project: {
      id: 'proj-1',
      name: 'CodeSasu',
      agentStatus: 'connected',
      lastAnalysis: '5분 전',
      issueCount: { critical: 2, warning: 3, info: 1 },
      implementationRate: 65,
      createdAt: '2026-03-28',
    },
  },
};

export const Disconnected: Story = {
  args: {
    project: {
      id: 'proj-2',
      name: 'My SaaS',
      agentStatus: 'disconnected',
      lastAnalysis: '2시간 전',
      issueCount: { critical: 0, warning: 1, info: 0 },
      implementationRate: 40,
      createdAt: '2026-03-15',
    },
  },
};

export const Complete: Story = {
  args: {
    project: {
      id: 'proj-3',
      name: 'Portfolio Site',
      agentStatus: 'connected',
      issueCount: { critical: 0, warning: 0, info: 0 },
      implementationRate: 100,
      createdAt: '2026-02-20',
    },
  },
};

export const LongName: Story = {
  args: {
    project: {
      id: 'proj-4',
      name: '매우 긴 프로젝트 이름의 사이드 프로젝트입니다',
      agentStatus: 'connected',
      lastAnalysis: '1일 전',
      issueCount: { critical: 5, warning: 8, info: 3 },
      implementationRate: 25,
      createdAt: '2026-01-10',
    },
  },
};
