import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Stepper } from './Stepper';

const onboardingSteps = [
  { label: '에이전트 설치' },
  { label: '기획서 업로드' },
  { label: '분석 실행' },
];

const meta = {
  title: 'UI/Stepper',
  component: Stepper,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  args: {
    steps: onboardingSteps,
    currentStep: 0,
  },
} satisfies Meta<typeof Stepper>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Step1: Story = {
  args: { currentStep: 0 },
};

export const Step2: Story = {
  args: { currentStep: 1 },
};

export const Step3: Story = {
  args: { currentStep: 2 },
};

export const AllCompleted: Story = {
  args: { currentStep: 3 },
};

export const AllSteps: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
      {[0, 1, 2, 3].map((step) => (
        <div key={step}>
          <p style={{ fontSize: 12, color: '#78716C', fontWeight: 600, marginBottom: 12 }}>
            currentStep: {step} {step === 3 ? '(all completed)' : ''}
          </p>
          <Stepper steps={onboardingSteps} currentStep={step} />
        </div>
      ))}
    </div>
  ),
};
