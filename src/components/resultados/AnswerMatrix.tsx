
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
    <div className="p-4">
      <table className="w-full border-collapse">
        <tbody>
          {matrix.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((questionNumber, colIndex) => (
                <td key={`${rowIndex}-${colIndex}`} className="border border-gray-300 p-0">
                  <QuestionCell
                    questionNumber={questionNumber}
                    selectedAnswer={questionNumber !== null ? answers[questionNumber] : undefined}
                    onAnswerChange={onAnswerChange}
                    options={questionNumber !== null ? getOptionsForQuestion(questionNumber) : []}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
