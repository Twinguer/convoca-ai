import { Link, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Timer } from 'lucide-react';

const cardShadow =
  '0 8px 25px rgba(0, 0, 0, 0.15), 0 4px 10px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.05)';

export function CronogramaTimerLinkCard() {
  const { token } = useParams();
  const timerPath = token ? `/estudos/timer/${token}` : '/estudos/timer';

  return (
    <Card
      className="rounded-xl border border-border bg-card text-card-foreground shadow-lg hover:shadow-2xl transition-shadow duration-300 overflow-hidden"
      style={{ boxShadow: cardShadow }}
    >
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Timer className="h-5 w-5" />
          Timer de Estudo
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            Use o timer para manter o foco. Ao terminar, registre tempo e questões no modal da tarefa.
          </p>
          <Button asChild className="w-full">
            <Link to={timerPath}>Abrir timer</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
