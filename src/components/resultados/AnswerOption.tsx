
import React from 'react';

interface AnswerOptionProps {
  option: string;
  isSelected: boolean;
  onClick: () => void;
  disabled?: boolean;
  examType?: 'Alternativas' | 'Certo ou Errado';
}

export const AnswerOption: React.FC<AnswerOptionProps> = ({
  option,
  isSelected,
  onClick,
  disabled = false,
  examType = 'Alternativas'
}) => {
  const isCertoErrado = examType === 'Certo ou Errado';
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        w-10 h-10 rounded-full flex items-center justify-center font-medium transition-colors uppercase
        ${isSelected 
          ? 'bg-emerald-600 text-white' 
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}
        ${disabled ? 'cursor-not-allowed opacity-50' : ''}
        ${isCertoErrado ? 'text-lg' : ''}
      `}
      type="button"
    >
      {option.toUpperCase()}
    </button>
  );
};
