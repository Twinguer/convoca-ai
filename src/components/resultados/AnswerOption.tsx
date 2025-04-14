
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
        h-8 flex items-center justify-center text-sm rounded
        ${isSelected 
          ? 'bg-blue-600 text-white font-medium' 
          : 'bg-gray-50 hover:bg-gray-100 text-gray-800'
        }
      `}
      onClick={onClick}
    >
      {option}
    </button>
  );
};
