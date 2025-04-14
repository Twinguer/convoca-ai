
import React from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

interface AnswerOptionProps {
  option: string;
  isSelected: boolean;
  onClick: () => void;
}

export const AnswerOption: React.FC<AnswerOptionProps> = ({ option, isSelected, onClick }) => {
  return (
    <div 
      className={`
        w-9 h-9 flex items-center justify-center rounded-full cursor-pointer
        ${isSelected 
          ? 'bg-blue-600 text-white ring-2 ring-blue-300 ring-offset-2' 
          : 'bg-white hover:bg-gray-100 text-gray-800 border border-gray-300'
        }
        transition-all duration-150 ease-in-out text-base font-medium
      `}
      onClick={onClick}
      role="button"
      aria-pressed={isSelected}
      tabIndex={0}
    >
      {option}
    </div>
  );
};
