
import React from 'react';

interface AnswerOptionProps {
  option: string;
  isSelected: boolean;
  onClick: () => void;
}

export const AnswerOption: React.FC<AnswerOptionProps> = ({ option, isSelected, onClick }) => {
  return (
    <div 
      className={`
        w-10 h-10 flex items-center justify-center rounded-full cursor-pointer shadow-sm
        ${isSelected 
          ? 'bg-blue-600 text-white font-bold ring-2 ring-blue-300 ring-offset-2' 
          : 'bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 hover:border-blue-300'
        }
        transition-all duration-150 ease-in-out text-base font-medium
      `}
      onClick={onClick}
      role="button"
      aria-pressed={isSelected}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onClick();
        }
      }}
    >
      {option}
    </div>
  );
};
