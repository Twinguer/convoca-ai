
import React from 'react';
import { QuestionCell } from './QuestionCell';

interface AnswerMatrixProps {
  matrix: (number | null)[][];
  answers: { [key: number]: string };
  onAnswerChange: (questionNumber: number, answer: string) => void;
  getOptionsForQuestion: (questionNumber: number) => string[];
}

export const AnswerMatrix: React.FC<AnswerMatrixProps> = ({ 
  matrix, 
  answers, 
  onAnswerChange,
  getOptionsForQuestion 
}) => {
  return (
    <div className="p-4 bg-white">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
