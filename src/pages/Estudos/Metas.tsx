import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { StudyGoals } from '@/components/StudyGoals';
import { SpacedRepetitionQueue } from '@/components/SpacedRepetitionQueue';
import { ScheduleTemplates } from '@/components/ScheduleTemplates';

export default function Metas() {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="icon" onClick={() => navigate('/estudos')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Metas e Revisões</h1>
          <p className="text-muted-foreground">Gerencie suas metas, streaks e revisões espaçadas</p>
        </div>
      </div>

      <Tabs defaultValue="metas" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="metas">Metas e Streaks</TabsTrigger>
          <TabsTrigger value="revisao">Repetição Espaçada</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="metas">
          <Card>
            <CardHeader>
              <CardTitle>Metas Diárias e Semanais</CardTitle>
            </CardHeader>
            <CardContent>
              <StudyGoals />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revisao">
          <Card>
            <CardHeader>
              <CardTitle>Fila de Repetição Espaçada</CardTitle>
            </CardHeader>
            <CardContent>
              <SpacedRepetitionQueue />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <CardTitle>Templates de Cronograma</CardTitle>
            </CardHeader>
            <CardContent>
              <ScheduleTemplates />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}