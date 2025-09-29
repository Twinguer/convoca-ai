import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Clock, BarChart3 } from 'lucide-react';
interface PerformanceChartProps {
  statistics: {
    totalHours: number;
    totalSessions: number;
    questionsAnswered: number;
    correctAnswers: number;
    sessionHistory: Array<{
      date: string;
      duration: number;
      type: 'timer' | 'manual';
      subject?: string;
    }>;
    subjectStats: Record<string, {
      totalHours: number;
      totalSessions: number;
      questionsAnswered: number;
      correctAnswers: number;
      wrongAnswers: number;
    }>;
  };
  timeFilter: 'day' | 'week' | 'month';
  onTimeFilterChange: (filter: 'day' | 'week' | 'month') => void;
}
const PerformanceChart: React.FC<PerformanceChartProps> = ({
  statistics,
  timeFilter,
  onTimeFilterChange
}) => {
  const [activeTab, setActiveTab] = useState<'questions' | 'time' | 'subjects'>('questions');
  const getChartData = () => {
    const now = new Date();
    let startDate: Date;
    let days: number;
    switch (timeFilter) {
      case 'day':
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        days = 1;
        break;
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 6);
        startDate.setHours(0, 0, 0, 0);
        days = 7;
        break;
      case 'month':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 29);
        startDate.setHours(0, 0, 0, 0);
        days = 30;
        break;
    }

    // Criar array com todos os dias no período
    const chartData = [];
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];

      // Filtrar sessões para este dia
      const sessionsForDay = statistics.sessionHistory.filter(session => {
        const sessionDate = new Date(session.date).toISOString().split('T')[0];
        return sessionDate === dateStr;
      });
      const totalTime = sessionsForDay.reduce((sum, session) => sum + session.duration / 60, 0);
      const questionsCount = sessionsForDay.length > 0 ? Math.floor(totalTime * 12) : 0; // Estimativa: 12 questões por hora

      chartData.push({
        date: timeFilter === 'day' ? date.toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit'
        }) : date.toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: timeFilter === 'month' ? '2-digit' : 'short'
        }),
        questions: questionsCount,
        time: totalTime,
        sessions: sessionsForDay.length
      });
    }
    return chartData;
  };
  const chartData = getChartData();
  const formatTooltipValue = (value: number, name: string) => {
    if (name === 'time') {
      return [`${value.toFixed(1)}h`, 'Tempo de Estudo'];
    }
    if (name === 'questions') {
      return [`${value}`, 'Questões'];
    }
    return [value, name];
  };
  const getSubjectChartData = () => {
    return Object.entries(statistics.subjectStats)
      .filter(([_, stats]) => stats.totalHours > 0)
      .sort((a, b) => b[1].totalHours - a[1].totalHours)
      .map(([subject, stats]) => ({
        subject: subject || 'Sem disciplina',
        hours: Number(stats.totalHours.toFixed(1)),
        sessions: stats.totalSessions,
        questions: stats.questionsAnswered,
        accuracy: stats.questionsAnswered > 0 ? Number((stats.correctAnswers / stats.questionsAnswered * 100).toFixed(1)) : 0
      }));
  };
  const subjectData = getSubjectChartData();
  return <Card className="col-span-2">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Gráfico de Desempenho
            </CardTitle>
            <CardDescription>
              Acompanhe sua evolução ao longo do tempo
            </CardDescription>
          </div>
          <Select value={timeFilter} onValueChange={(value: 'day' | 'week' | 'month') => onTimeFilterChange(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Hoje</SelectItem>
              <SelectItem value="week">7 dias</SelectItem>
              <SelectItem value="month">30 dias</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(value: 'questions' | 'time' | 'subjects') => setActiveTab(value)} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="questions" className="flex items-center gap-2 text-slate-800">
              <BarChart3 className="h-4 w-4" />
              Questões
            </TabsTrigger>
            <TabsTrigger value="time" className="flex items-center gap-2 text-slate-800">
              <Clock className="h-4 w-4" />
              Tempo
            </TabsTrigger>
            <TabsTrigger value="subjects" className="flex items-center gap-2 text-slate-800">
              <BarChart3 className="h-4 w-4" />
              Disciplinas
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="questions" className="mt-6">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip formatter={formatTooltipValue} contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px',
                color: 'hsl(var(--foreground))'
              }} />
                <Bar dataKey="questions" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>
          
          <TabsContent value="time" className="mt-6">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip formatter={formatTooltipValue} contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px',
                color: 'hsl(var(--foreground))'
              }} />
                <Line type="monotone" dataKey="time" stroke="hsl(var(--primary))" strokeWidth={2} dot={{
                fill: 'hsl(var(--primary))',
                strokeWidth: 2,
                r: 4
              }} activeDot={{
                r: 6,
                fill: 'hsl(var(--primary))'
              }} />
              </LineChart>
            </ResponsiveContainer>
          </TabsContent>
          
          <TabsContent value="subjects" className="mt-6">
            {subjectData.length > 0 ? <ResponsiveContainer width="100%" height={300}>
                <BarChart data={subjectData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="subject" stroke="hsl(var(--muted-foreground))" fontSize={12} angle={-45} textAnchor="end" height={80} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px',
                color: 'hsl(var(--foreground))'
              }} />
                  <Bar dataKey="hours" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Horas" />
                </BarChart>
              </ResponsiveContainer> : <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                <div className="text-center">
                  <BarChart3 className="mx-auto h-12 w-12 mb-4" />
                  <p>Nenhuma disciplina registrada ainda</p>
                  <p className="text-sm">Use o timer e registre suas disciplinas de estudo</p>
                </div>
              </div>}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>;
};
export default PerformanceChart;