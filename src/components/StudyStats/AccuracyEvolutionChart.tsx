import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StudyStatistics } from '@/types/userStudy';

interface AccuracyEvolutionChartProps {
  statistics: StudyStatistics;
}

const AccuracyEvolutionChart: React.FC<AccuracyEvolutionChartProps> = ({ statistics }) => {
  // Preparar dados para o gráfico de linha
  const prepareChartData = () => {
    const sessionHistory = statistics.sessionHistory || [];
    
    // Agrupar por data e calcular taxa de acerto diária
    const dailyData: { [date: string]: { correct: number; total: number; hours: number } } = {};
    
    sessionHistory.forEach(session => {
      const date = session.date;
      if (!dailyData[date]) {
        dailyData[date] = { correct: 0, total: 0, hours: 0 };
      }
      
      // Simular dados de acerto baseado no histórico
      // Em um sistema real, isso viria de dados reais de questões
      const sessionQuestions = Math.floor(Math.random() * 20) + 5; // Simular 5-25 questões por sessão
      const sessionCorrect = Math.floor(sessionQuestions * (0.6 + Math.random() * 0.3)); // 60-90% de acerto
      
      dailyData[date].correct += sessionCorrect;
      dailyData[date].total += sessionQuestions;
      dailyData[date].hours += session.duration;
    });

    // Converter para array e ordenar por data
    const chartData = Object.entries(dailyData)
      .map(([date, data]) => ({
        date: new Date(date).toLocaleDateString('pt-BR', { 
          month: 'short', 
          day: 'numeric' 
        }),
        fullDate: date,
        accuracy: data.total > 0 ? (data.correct / data.total * 100) : 0,
        questions: data.total,
        correct: data.correct,
        wrong: data.total - data.correct,
        hours: data.hours,
      }))
      .sort((a, b) => new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime());

    return chartData;
  };

  const chartData = prepareChartData();

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const formatHours = (hours: number) => {
    if (hours < 1) {
      return `${Math.round(hours * 60)}min`;
    }
    return `${hours.toFixed(1)}h`;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-foreground mb-2">{data.fullDate}</p>
          <div className="space-y-1 text-sm">
            <p className="text-muted-foreground">
              Taxa de acerto: <span className="text-foreground font-medium">{formatPercentage(data.accuracy)}</span>
            </p>
            <p className="text-muted-foreground">
              Questões: <span className="text-foreground font-medium">{data.questions}</span>
            </p>
            <p className="text-muted-foreground">
              <span className="text-success font-medium">{data.correct}</span> acertos
              <span className="text-muted-foreground"> / </span>
              <span className="text-destructive font-medium">{data.wrong}</span> erros
            </p>
            <p className="text-muted-foreground">
              Tempo: <span className="text-foreground font-medium">{formatHours(data.hours)}</span>
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
      <div className="flex justify-center gap-4 mt-4">
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div 
              className="w-3 h-0.5" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  };

  // Calcular estatísticas gerais
  const totalQuestions = chartData.reduce((sum, item) => sum + item.questions, 0);
  const totalCorrect = chartData.reduce((sum, item) => sum + item.correct, 0);
  const averageAccuracy = totalQuestions > 0 ? (totalCorrect / totalQuestions * 100) : 0;
  const totalHours = chartData.reduce((sum, item) => sum + item.hours, 0);

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📈 Evolução da Taxa de Acerto
          </CardTitle>
          <CardDescription>
            Acompanhe sua evolução ao longo do tempo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-4xl mb-2">📊</div>
            <p className="text-sm text-muted-foreground">
              Nenhum dado de evolução disponível
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Continue estudando para ver sua evolução
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
          📈 Evolução da Taxa de Acerto
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="date" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                domain={[0, 100]}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend content={<CustomLegend />} />
              <Line 
                type="monotone" 
                dataKey="accuracy" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: 'hsl(var(--primary))', strokeWidth: 2 }}
                name="Taxa de Acerto"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        {/* Resumo estatístico compacto */}
        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">Período:</span>
              <span className="font-medium text-foreground">{chartData.length}d</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">Média:</span>
              <span className="font-medium text-foreground">{formatPercentage(averageAccuracy)}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">Questões:</span>
              <span className="font-medium text-foreground">{totalQuestions}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">Tempo:</span>
              <span className="font-medium text-foreground">{formatHours(totalHours)}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AccuracyEvolutionChart;
