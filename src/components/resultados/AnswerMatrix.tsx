
import React from 'react';
import { QuestionCell } from './QuestionCell';

interface AnswerMatrixProps {
  matrix: (number | null)[][];
  answers: { [key: number]: string };
  onAnswerChange: (questionNumber: number, answer: string) => void;
  getOptionsForQuestion: (questionNumber: number) => string[];
  disabled?: boolean;
}

export const AnswerMatrix: React.FC<AnswerMatrixProps> = ({ 
  matrix, 
  answers, 
  onAnswerChange,
  getOptionsForQuestion,
  disabled = false
}) => {
  if (matrix.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500">
        Nenhuma questão disponível para esta seção. Por favor, selecione outra seção.
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-50">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {matrix.map((row, rowIndex) => (
          <React.Fragment key={rowIndex}>
            {row.map((questionNumber, colIndex) => (
              questionNumber !== null && (
                <div key={`${rowIndex}-${colIndex}`}>
                  <QuestionCell
                    questionNumber={questionNumber}
                    selectedAnswer={answers[questionNumber]}
                    onAnswerChange={onAnswerChange}
                    options={getOptionsForQuestion(questionNumber)}
                    disabled={disabled}
                  />
                </div>
              )
            ))}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
