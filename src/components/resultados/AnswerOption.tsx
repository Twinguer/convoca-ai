
import React from 'react';

interface AnswerOptionProps {
  option: string;
  isSelected: boolean;
  onClick: () => void;
}

export const AnswerOption: React.FC<AnswerOptionProps> = ({ option, isSelected, onClick }) => {
  return (
    <button
      type="button"
      className={`
        w-8 h-8 flex items-center justify-center text-sm rounded-full 
        ${isSelected 
          ? 'bg-blue-600 text-white font-medium border-2 border-blue-700' 
          : 'bg-gray-50 hover:bg-gray-100 text-gray-800 border border-gray-300'
        }
        transition-colors
      `}
      onClick={onClick}
    >
      {option}
    </button>
  );
};
