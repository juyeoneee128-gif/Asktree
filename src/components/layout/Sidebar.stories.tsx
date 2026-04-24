import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import {
  BarChart2,
  AlertCircle,
  Shield,
  Clock,
  FileText,
  Settings,
} from 'lucide-react';
import { Sidebar } from './Sidebar';

const defaultMenuItems = [
  { key: 'status', label: '현황', icon: <BarChart2 size={18} /> },
  { key: 'issues', label: '이슈', icon: <AlertCircle size={18} />, badge: 4 },
  { key: 'claude-md', label: 'CLAUDE.md', icon: <Shield size={18} />, badge: 2 },
  { key: 'sessions', label: '세션', icon: <Clock size={18} /> },
  { key: 'specs', label: '기획서', icon: <FileText size={18} /> },
  { key: 'settings', label: '설정', icon: <Settings size={18} /> },
];

const meta = {
  title: 'Layout/Sidebar',
  component: Sidebar,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ height: '100vh', display: 'flex' }}>
        <Story />
      </div>
    ),
  ],
  args: {
    projectName: 'Asktree',
    menuItems: defaultMenuItems,
    activeMenu: 'issues',
    agentStatus: 'connected',
    onMenuClick: fn(),
    onProjectSelect: fn(),
  },
} satisfies Meta<typeof Sidebar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Connected: Story = {};

export const Disconnected: Story = {
  args: {
    agentStatus: 'disconnected',
  },
};

export const NoBadges: Story = {
  args: {
    menuItems: defaultMenuItems.map((item) => ({ ...item, badge: undefined })),
    activeMenu: 'status',
  },
};

export const LongProjectName: Story = {
  args: {
    projectName: 'My Very Long Project Name That Might Overflow',
  },
};
