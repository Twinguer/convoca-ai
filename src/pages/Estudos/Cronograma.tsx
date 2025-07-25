import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Plus, Settings } from 'lucide-react';

const Cronograma = () => {
  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Cronograma de Estudos</h1>
          <p className="text-muted-foreground">Organize seu tempo e maximize seus resultados</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Configurações
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nova Sessão
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Cronograma Semanal
          </CardTitle>
          <CardDescription>
            Seu cronograma de estudos organizado por dias da semana
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center p-8">
            <Calendar className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Cronograma em desenvolvimento</h3>
            <p className="text-muted-foreground mb-4">
              Esta funcionalidade está sendo desenvolvida. Em breve você poderá criar e gerenciar seu cronograma de estudos.
            </p>
            <Button disabled>
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeiro Cronograma
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Cronograma;