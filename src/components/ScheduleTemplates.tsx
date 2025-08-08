import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { FileText, Download, Users, Building2, BookOpen } from 'lucide-react';
import { useScheduleTemplates } from '@/hooks/useScheduleTemplates';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface ScheduleTemplatesProps {
  cycleId?: string;
  onTemplateApplied?: (blocks: any[]) => void;
}

export const ScheduleTemplates = ({ cycleId, onTemplateApplied }: ScheduleTemplatesProps) => {
  const { templates, loading, applyTemplate } = useScheduleTemplates();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);

  const handleApplyTemplate = async (templateId: string) => {
    if (!cycleId) {
      toast({
        title: "Erro",
        description: "ID do ciclo não encontrado",
        variant: "destructive"
      });
      return;
    }

    const blocks = await applyTemplate(templateId, cycleId);
    if (blocks) {
      toast({
        title: "Sucesso!",
        description: "Template aplicado com sucesso",
      });
      
      if (onTemplateApplied) {
        onTemplateApplied(blocks);
      }
    } else {
      toast({
        title: "Erro",
        description: "Falha ao aplicar template",
        variant: "destructive"
      });
    }
  };

  const getTemplateTypeIcon = (type: string) => {
    return type === 'bank' ? <Building2 className="h-4 w-4" /> : <BookOpen className="h-4 w-4" />;
  };

  const getTemplateTypeLabel = (type: string) => {
    return type === 'bank' ? 'Banca' : 'Concurso';
  };

  if (loading) {
    return <div className="animate-pulse space-y-4">
      <div className="h-6 bg-muted rounded w-48"></div>
      <div className="grid gap-3">
        <div className="h-24 bg-muted rounded"></div>
        <div className="h-24 bg-muted rounded"></div>
      </div>
    </div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <FileText className="h-5 w-5" />
        <h3 className="text-lg font-semibold">Templates de Cronograma</h3>
      </div>

      <div className="grid gap-3">
        {templates.map(template => (
          <Card key={template.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{template.name}</span>
                    <Badge variant="outline" className="flex items-center gap-1">
                      {getTemplateTypeIcon(template.template_type)}
                      {getTemplateTypeLabel(template.template_type)}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{template.organization}</span>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{template.usage_count} usos</span>
                    </div>
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    {template.schedule_data.length} dias configurados
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedTemplate(template)}
                      >
                        Visualizar
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>{selectedTemplate?.name}</DialogTitle>
                      </DialogHeader>
                      
                      {selectedTemplate && (
                        <div className="space-y-4">
                          <div className="text-sm text-muted-foreground">
                            {selectedTemplate.organization} • {getTemplateTypeLabel(selectedTemplate.template_type)}
                          </div>
                          
                          <div className="grid gap-3">
                            {selectedTemplate.schedule_data.map((day: any, index: number) => (
                              <Card key={index}>
                                <CardContent className="p-3">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <div className="font-medium">
                                        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][day.day]}
                                      </div>
                                      <div className="text-sm text-muted-foreground">
                                        {day.subjects.join(', ')}
                                      </div>
                                    </div>
                                    <Badge variant="outline">
                                      {day.hours}h
                                    </Badge>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                  
                  {cycleId && (
                    <Button 
                      onClick={() => handleApplyTemplate(template.id)}
                      size="sm"
                      className="flex items-center gap-1"
                    >
                      <Download className="h-4 w-4" />
                      Aplicar
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {templates.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Nenhum template disponível</p>
              <p className="text-sm">Templates serão carregados automaticamente</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};