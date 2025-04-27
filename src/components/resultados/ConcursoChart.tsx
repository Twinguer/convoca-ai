
import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface RankingData {
  position: number;
  score: number;
}

interface ConcursoChartProps {
  rankings: RankingData[];
}

const ConcursoChart: React.FC<ConcursoChartProps> = ({ rankings }) => {
  // Process data for the chart
  const processData = () => {
    if (!rankings || rankings.length === 0) return [];
    
    // Create histogram of scores
    const scoreMap = new Map<number, number>();
    
    // Round scores to nearest 0.5 for better grouping
    rankings.forEach(rank => {
      const roundedScore = Math.round(rank.score * 2) / 2; // Round to nearest 0.5
      scoreMap.set(roundedScore, (scoreMap.get(roundedScore) || 0) + 1);
    });
    
    // Convert map to array of objects for recharts
    return Array.from(scoreMap.entries())
      .map(([score, count]) => ({
        score: score.toFixed(1),
        count
      }))
      .sort((a, b) => parseFloat(a.score) - parseFloat(b.score));
  };

  const data = processData();
  
  if (data.length === 0) {
    return <div className="text-center py-8 text-gray-500">Sem dados suficientes para gerar o gráfico</div>;
  }
  
  return (
    <div className="w-full h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 30,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="score" 
            label={{ value: 'Pontuação', position: 'insideBottom', offset: -10 }} 
          />
          <YAxis 
            label={{ value: 'Quantidade', angle: -90, position: 'insideLeft', offset: 10 }} 
          />
          <Tooltip formatter={(value) => [`${value} participantes`, 'Quantidade']} />
          <Legend />
          <Bar dataKey="count" name="Participantes" fill="#10b981" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ConcursoChart;
