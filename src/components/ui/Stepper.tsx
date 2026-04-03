import { Check } from 'lucide-react';

export interface StepperStep {
  label: string;
}

export interface StepperProps {
  steps: StepperStep[];
  /** 0-based current step index */
  currentStep: number;
}

export function Stepper({ steps, currentStep }: StepperProps) {
  return (
    <div className="flex items-center justify-center gap-0">
      {steps.map((step, i) => {
        const isCompleted = i < currentStep;
        const isActive = i === currentStep;
        const isLast = i === steps.length - 1;

        return (
          <div key={step.label} className="flex items-center">
            {/* Step circle + label */}
            <div className="flex flex-col items-center">
              <div
                className={[
                  'w-8 h-8 rounded-full flex items-center justify-center text-[14px] font-semibold transition-colors',
                  isCompleted
                    ? 'bg-primary text-primary-foreground'
                    : isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-gray-200 text-gray-400',
                ].join(' ')}
              >
                {isCompleted ? <Check size={16} /> : i + 1}
              </div>
              <span
                className={[
                  'text-[12px] mt-2 whitespace-nowrap',
                  isActive
                    ? 'text-primary font-semibold'
                    : isCompleted
                      ? 'text-primary font-medium'
                      : 'text-gray-400',
                ].join(' ')}
              >
                {step.label}
              </span>
            </div>

            {/* Connector line */}
            {!isLast && (
              <div
                className={[
                  'w-16 h-0.5 mx-3 mb-6 transition-colors',
                  isCompleted ? 'bg-primary' : 'bg-gray-200',
                ].join(' ')}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
