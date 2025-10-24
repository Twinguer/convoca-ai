import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StudyStatistics } from '@/types/userStudy';

interface StudyHeatmapChartProps {
  statistics: StudyStatistics;
}

interface HeatmapData {
  date: string;
  hours: number;
  sessions: number;
  intensity: 'none' | 'low' | 'medium' | 'high' | 'very-high';
  isToday: boolean;
  isFuture: boolean;
}

const StudyHeatmapChart: React.FC<StudyHeatmapChartProps> = ({ statistics }) => {
  // Preparar dados para o heatmap (últimos 6 meses = ~180 dias)
  const prepareHeatmapData = (): HeatmapData[] => {
    const data: HeatmapData[] = [];
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 179); // Últimos 180 dias (6 meses)

    // Criar array de todos os dias
    for (let i = 0; i < 180; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      const dateString = date.toISOString().split('T')[0];
      
      const isToday = dateString === today.toISOString().split('T')[0];
      const isFuture = date > today;
      
      // Buscar dados do dia
      const dayStats = statistics.dailyStats[dateString] || { hours: 0, sessions: 0 };
      
      // Calcular intensidade baseada nas horas
      let intensity: 'none' | 'low' | 'medium' | 'high' | 'very-high' = 'none';
      if (dayStats.hours > 0) {
        if (dayStats.hours >= 6) intensity = 'very-high';
        else if (dayStats.hours >= 4) intensity = 'high';
        else if (dayStats.hours >= 2) intensity = 'medium';
        else intensity = 'low';
      }
      
      data.push({
        date: dateString,
        hours: dayStats.hours,
        sessions: dayStats.sessions,
        intensity,
        isToday,
        isFuture
      });
    }

    return data;
  };

  const heatmapData = prepareHeatmapData();

  // Agrupar dados por semanas
  const groupByWeeks = (data: HeatmapData[]) => {
    const weeks: { [key: string]: HeatmapData[] } = {};
    
    data.forEach((day, index) => {
      const weekNumber = Math.floor(index / 7);
      const weekKey = `week${weekNumber}`;
      
      if (!weeks[weekKey]) {
        weeks[weekKey] = [];
      }
      weeks[weekKey].push(day);
    });
    
    return weeks;
  };

  const weeksData = groupByWeeks(heatmapData);
  const weekNumbers = Object.keys(weeksData).sort();

  // Calcular estatísticas
  const totalDays = heatmapData.length;
  const studyDays = heatmapData.filter(d => d.hours > 0).length;
  const totalHours = heatmapData.reduce((sum, d) => sum + d.hours, 0);
  const averageHours = studyDays > 0 ? totalHours / studyDays : 0;
  const currentStreak = statistics.currentStreak;
  const longestStreak = statistics.longestStreak;

  // Obter cor baseada na intensidade
  const getIntensityColor = (intensity: string, isToday: boolean, isFuture: boolean) => {
    if (isFuture) return 'bg-muted/30';
    if (isToday) return 'ring-2 ring-primary';
    
    switch (intensity) {
      case 'very-high': return 'bg-success';
      case 'high': return 'bg-success/80';
      case 'medium': return 'bg-success/60';
      case 'low': return 'bg-success/40';
      case 'none': return 'bg-muted/50';
      default: return 'bg-muted/50';
    }
  };

  // Obter tooltip baseado na intensidade
  const getIntensityLabel = (intensity: string) => {
    switch (intensity) {
      case 'very-high': return 'Muito intenso (6h+)';
      case 'high': return 'Intenso (4-6h)';
      case 'medium': return 'Moderado (2-4h)';
      case 'low': return 'Leve (1-2h)';
      case 'none': return 'Sem estudo';
      default: return 'Sem dados';
    }
  };

  const formatHours = (hours: number) => {
    if (hours < 1) {
      return `${Math.round(hours * 60)}min`;
    }
    return `${hours.toFixed(1)}h`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-foreground">{formatDate(data.date)}</p>
          <div className="space-y-1 text-sm">
            {data.hours > 0 ? (
              <>
                <p className="text-muted-foreground">
                  <span className="text-foreground font-medium">{formatHours(data.hours)}</span> de estudo
                </p>
                <p className="text-muted-foreground">
                  <span className="text-foreground font-medium">{data.sessions}</span> sessões
                </p>
                <p className="text-muted-foreground">
                  {getIntensityLabel(data.intensity)}
                </p>
              </>
            ) : (
              <p className="text-muted-foreground">Nenhum estudo registrado</p>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  if (totalHours === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📅 Calendário de Estudos
          </CardTitle>
          <CardDescription>
            Acompanhe sua consistência de estudo ao longo do tempo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-4xl mb-2">📚</div>
            <p className="text-sm text-muted-foreground">
              Nenhum estudo registrado ainda
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Comece a estudar para ver seu calendário de progresso
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
          📅 Calendário de Estudos
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Estatísticas com altura reduzida em 10% */}
        <div className="grid grid-cols-4 gap-3 mb-3">
          <div className="text-center p-1.5 bg-muted/30 rounded-lg">
            <div className="text-base font-bold text-foreground">{studyDays}</div>
            <div className="text-xs text-muted-foreground">Dias</div>
          </div>
          <div className="text-center p-1.5 bg-muted/30 rounded-lg">
            <div className="text-base font-bold text-foreground">{formatHours(totalHours)}</div>
            <div className="text-xs text-muted-foreground">Total</div>
          </div>
          <div className="text-center p-1.5 bg-muted/30 rounded-lg">
            <div className="text-base font-bold text-foreground">{formatHours(averageHours)}</div>
            <div className="text-xs text-muted-foreground">Média</div>
          </div>
          <div className="text-center p-1.5 bg-muted/30 rounded-lg">
            <div className="text-base font-bold text-foreground">{currentStreak}</div>
            <div className="text-xs text-muted-foreground">Seq</div>
          </div>
        </div>

        {/* Heatmap com altura reduzida em 10% */}
        <div className="space-y-1.5">
          {/* Cabeçalho com dias da semana */}
          <div className="grid grid-cols-7 gap-0.5 text-xs text-muted-foreground text-center">
            <div>D</div>
            <div>S</div>
            <div>T</div>
            <div>Q</div>
            <div>Q</div>
            <div>S</div>
            <div>S</div>
          </div>

          {/* Grid do heatmap com altura reduzida */}
          <div className="grid grid-cols-7 gap-0.5">
            {weekNumbers.map(weekKey => (
              <React.Fragment key={weekKey}>
                {weeksData[weekKey].map((day, dayIndex) => (
                  <div
                    key={`${weekKey}-${dayIndex}`}
                    className={`
                      w-2.5 h-2.5 rounded-sm cursor-pointer transition-all duration-200 hover:scale-125
                      ${getIntensityColor(day.intensity, day.isToday, day.isFuture)}
                    `}
                    title={`${formatDate(day.date)}: ${day.hours > 0 ? formatHours(day.hours) : 'Sem estudo'}`}
                  />
                ))}
              </React.Fragment>
            ))}
          </div>

          {/* Legenda com altura reduzida em 10% */}
          <div className="flex items-center justify-between mt-2 p-1.5 bg-muted/20 rounded-lg">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Menos</span>
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-muted/50 rounded-sm"></div>
                <div className="w-2 h-2 bg-success/40 rounded-sm"></div>
                <div className="w-2 h-2 bg-success/60 rounded-sm"></div>
                <div className="w-2 h-2 bg-success/80 rounded-sm"></div>
                <div className="w-2 h-2 bg-success rounded-sm"></div>
              </div>
              <span>Mais</span>
            </div>
            
            <div className="flex items-center gap-2 text-xs">
              <Badge variant="outline" className="text-xs px-2 py-1">
                Atual: {currentStreak}
              </Badge>
              <Badge variant="outline" className="text-xs px-2 py-1">
                Melhor: {longestStreak}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StudyHeatmapChart;
