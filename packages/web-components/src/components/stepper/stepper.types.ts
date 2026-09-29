export interface StepConfig {
  label: string;
  description?: string;
}

export interface StepperChangeDetail {
  step: number;
  prev: number;
  direction: 'next' | 'prev' | 'jump';
}
