
import React from 'react';
import { OwnerIcon } from '../OwnerIcons';

interface StepperProps {
  steps: string[];
  currentStep: number; // 0-indexed
}

export const Stepper: React.FC<StepperProps> = ({ steps, currentStep }) => {
  return (
    <div className="flex items-center w-full">
      {steps.map((step, i) => {
        const isCompleted = i < currentStep;
        const isCurrent = i === currentStep;
        
        return (
          <React.Fragment key={i}>
            <div className="relative flex flex-col items-center">
              <div 
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all z-10
                    ${isCompleted ? 'bg-green-500 border-green-500 text-white' : ''}
                    ${isCurrent ? 'bg-white border-gyn-blue-medium text-gyn-blue-medium shadow-[0_0_0_4px_rgba(48,65,199,0.2)]' : ''}
                    ${!isCompleted && !isCurrent ? 'bg-white border-gray-200 text-gray-300' : ''}
                `}
              >
                {isCompleted ? <OwnerIcon name="CheckCircleIcon" className="w-6 h-6" /> : <span className="font-bold text-sm">{i + 1}</span>}
              </div>
              <span className={`absolute -bottom-6 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${isCurrent ? 'text-gyn-blue-dark' : 'text-gray-400'}`}>
                  {step}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-1 mx-2 rounded-full transition-colors ${i < currentStep ? 'bg-green-500' : 'bg-gray-200'}`}></div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};
