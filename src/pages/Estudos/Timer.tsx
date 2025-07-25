import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Timer as TimerIcon, Play, Pause, Square } from 'lucide-react';

const Timer = () => {
  return (
    <div className="container mx-auto p-6">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Timer de Estudo</h1>
          <p className="text-muted-foreground">Mantenha o foco com sessões cronometradas</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 justify-center">
              <TimerIcon className="h-5 w-5" />
              Cronômetro Pomodoro
            </CardTitle>
            <CardDescription className="text-center">
              Técnica de produtividade com intervalos de foco e descanso
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center p-8">
              <div className="text-6xl font-bold mb-8">25:00</div>
              
              <div className="flex justify-center gap-4 mb-8">
                <Button size="lg">
                  <Play className="h-5 w-5 mr-2" />
                  Iniciar
                </Button>
                <Button size="lg" variant="outline" disabled>
                  <Pause className="h-5 w-5 mr-2" />
                  Pausar
                </Button>
                <Button size="lg" variant="outline" disabled>
                  <Square className="h-5 w-5 mr-2" />
                  Parar
                </Button>
              </div>

              <div className="text-muted-foreground">
                <p className="mb-2">Timer em desenvolvimento</p>
                <p className="text-sm">
                  Em breve: cronômetro funcional, configurações personalizadas e histórico de sessões
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Timer;