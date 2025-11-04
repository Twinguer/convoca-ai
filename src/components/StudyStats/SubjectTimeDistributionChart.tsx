import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StudyStatistics } from '@/types/userStudy';

interface SubjectTimeDistributionChartProps {
  statistics: StudyStatistics;
}

const COLORS = [
  'hsl(var(--primary))',
  '#3B82F6', // Blue 500
  '#1D4ED8', // Blue 700
  '#1E40AF', // Blue 800
  '#1E3A8A', // Blue 900
  '#60A5FA', // Blue 400
  '#93C5FD', // Blue 300
  '#DBEAFE', // Blue 100
  '#2563EB', // Blue 600
  '#1E90FF', // Dodger Blue
  '#4169E1', // Royal Blue
  '#0000CD', // Medium Blue
];

const SubjectTimeDistributionChart: React.FC<SubjectTimeDistributionChartProps> = ({ statistics }) => {
  // Preparar dados para o gráfico de pizza
  const chartData = Object.entries(statistics.subjectStats)
    .map(([subject, stats]) => ({
      name: subject,
      value: stats.totalHours,
      sessions: stats.totalSessions,
      questions: stats.questionsAnswered,
      correctAnswers: stats.correctAnswers,
      wrongAnswers: stats.wrongAnswers,
    }))
    .sort((a, b) => b.value - a.value);

  const totalHours = chartData.reduce((sum, item) => sum + item.value, 0);

  const formatHours = (hours: number) => {
    if (hours < 1) {
      return `${Math.round(hours * 60)}min`;
    }
    return `${hours.toFixed(1)}h`;
  };

  const formatPercentage = (value: number) => {
    if (totalHours === 0) return '0%';
    return `${(value / totalHours * 100).toFixed(1)}%`;
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-foreground">{data.name}</p>
          <div className="space-y-1 text-sm">
            <p className="text-muted-foreground">
              <span className="text-foreground font-medium">{formatHours(data.value)}</span> de estudo
            </p>
            <p className="text-muted-foreground">
              <span className="text-foreground font-medium">{data.sessions}</span> sessões
            </p>
            <p className="text-muted-foreground">
              <span className="text-foreground font-medium">{data.questions}</span> questões
            </p>
            {data.questions > 0 && (
              <p className="text-muted-foreground">
                <span className="text-success font-medium">{data.correctAnswers}</span> acertos
                <span className="text-muted-foreground"> / </span>
                <span className="text-destructive font-medium">{data.wrongAnswers}</span> erros
              </p>
            )}
            <p className="text-muted-foreground">
              {formatPercentage(data.value)} do tempo total
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomLegend = ({ payload }: any) => {
    if (!payload || payload.length === 0) return null;

    return (
      <div className="flex flex-wrap gap-2 justify-center mt-4">
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">
              {entry.value} ({formatPercentage(entry.payload.value)})
            </span>
          </div>
        ))}
      </div>
    );
  };

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📊 Distribuição do Tempo por Disciplina
          </CardTitle>
          <CardDescription>
            Tempo de estudo dedicado a cada disciplina
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-4xl mb-2">📚</div>
            <p className="text-sm text-muted-foreground">
              Nenhuma disciplina registrada ainda
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Comece a estudar para ver a distribuição do tempo
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          📊 Distribuição do Tempo por Disciplina
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => {
                  const percentage = formatPercentage(value);
                  return `${name}: ${formatHours(value)} (${percentage})`;
                }}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend content={<CustomLegend />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        {/* Resumo estatístico compacto */}
        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">Disciplinas:</span>
              <span className="font-medium text-foreground">{chartData.length}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">Total:</span>
              <span className="font-medium text-foreground">{formatHours(totalHours)}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SubjectTimeDistributionChart;
