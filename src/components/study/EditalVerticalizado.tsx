import React, { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronRight, ChevronDown, BookOpen, Plus, Trash2 } from 'lucide-react';
import { ProFeatureGuard } from '@/components/Subscription/ProFeatureGuard';
import { useSubscription } from '@/hooks/useSubscription';

interface Discipline {
  id: string;
  name: string;
  isCompleted?: boolean;
  status?: 'em_andamento' | 'finalizada' | 'em_revisao' | null;
}

interface Block {
  id: string;
  name: string;
  disciplines: Discipline[];
}

interface EditalVerticalizadoProps {
  blocks: Block[];
  onToggleDiscipline?: (blockId: string, disciplineId: string) => void;
  onToggleBlock?: (blockId: string) => void;
  onStatusChange?: (blockId: string, disciplineId: string, status: 'em_andamento' | 'finalizada' | 'em_revisao' | null) => void;
  onAddDiscipline?: (blockId: string) => void;
  onEditDiscipline?: (blockId: string, disciplineId: string) => void;
  onRemoveDiscipline?: (blockId: string, disciplineId: string) => void;
  expandedBlocks?: Set<string>;
  showProgress?: boolean;
  className?: string;
  allowEdit?: boolean;
}

export const EditalVerticalizado: React.FC<EditalVerticalizadoProps> = ({
  blocks,
  onToggleDiscipline,
  onToggleBlock,
  onStatusChange,
  onAddDiscipline,
  onEditDiscipline,
  onRemoveDiscipline,
  expandedBlocks: externalExpandedBlocks,
  showProgress = true,
  className = "",
  allowEdit = false
}) => {
  const { isPro, isLoading: isLoadingSubscription } = useSubscription();
  const [internalExpandedBlocks, setInternalExpandedBlocks] = useState<Set<string>>(new Set());
  
  // Usar estado externo se fornecido, senão usar interno
  const expandedBlocks = externalExpandedBlocks || internalExpandedBlocks;
  const setExpandedBlocks = externalExpandedBlocks ? (() => {}) : setInternalExpandedBlocks;

  const handleToggleBlock = (blockId: string) => {
    if (onToggleBlock) {
      onToggleBlock(blockId);
    } else {
      const newExpanded = new Set(expandedBlocks);
      if (newExpanded.has(blockId)) {
        newExpanded.delete(blockId);
      } else {
        newExpanded.add(blockId);
      }
      setExpandedBlocks(newExpanded);
    }
  };

  const handleToggleDiscipline = (blockId: string, disciplineId: string) => {
    if (onToggleDiscipline) {
      onToggleDiscipline(blockId, disciplineId);
    }
  };

  const handleStatusChange = (blockId: string, disciplineId: string, status: 'em_andamento' | 'finalizada' | 'em_revisao' | null) => {
    if (onStatusChange) {
      // Se um status está sendo marcado, garantir que os outros sejam desmarcados
      // Isso é feito automaticamente pela lógica de atualização no componente pai
      onStatusChange(blockId, disciplineId, status);
    }
  };

  // Calcular estatísticas
  const totalDisciplines = blocks.reduce((total, block) => total + block.disciplines.length, 0);
  const completedDisciplines = blocks.reduce((total, block) => 
    total + block.disciplines.filter(d => d.isCompleted).length, 0
  );
  const progressPercentage = totalDisciplines > 0 ? Math.round((completedDisciplines / totalDisciplines) * 100) : 0;

  const renderBlock = (block: Block, blockIndex: number) => {
    const isExpanded = expandedBlocks.has(block.id);
    const hasDisciplines = block.disciplines && block.disciplines.length > 0;
    const blockCompleted = hasDisciplines && block.disciplines.every(d => d.isCompleted);
    
    return (
      <div key={block.id}>
        {/* Tópico Principal (Bloco) */}
        <div 
          className={`flex items-center py-2 px-4 ${
            blockIndex % 2 === 0 ? 'bg-muted/20' : 'bg-background'
          } hover:bg-muted/40 transition-colors ${
            hasDisciplines ? 'cursor-pointer' : ''
          }`}
          onClick={() => hasDisciplines && handleToggleBlock(block.id)}
        >
          <Checkbox
            checked={blockCompleted}
            onCheckedChange={() => {
              // Toggle all disciplines in this block
              block.disciplines.forEach(discipline => {
                handleToggleDiscipline(block.id, discipline.id);
              });
            }}
            className="mt-0.5 mr-3 flex-shrink-0"
            onClick={(e) => e.stopPropagation()}
          />
          <div className="flex-1">
            <span className="font-semibold text-foreground text-sm">
              {blockIndex + 1}. {block.name.toUpperCase()}
            </span>
            {showProgress && hasDisciplines && (
              <span className="ml-2 text-xs text-muted-foreground">
                ({block.disciplines.filter(d => d.isCompleted).length}/{block.disciplines.length})
              </span>
            )}
          </div>
          <div className="ml-2 flex items-center gap-2">
            {allowEdit && onAddDiscipline && (
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddDiscipline(block.id);
                }}
                title="Adicionar disciplina"
              >
                <Plus className="h-3 w-3" />
              </Button>
            )}
            {hasDisciplines && (
              <div>
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Sub-tópicos (Disciplinas) */}
        {hasDisciplines && isExpanded && (
          <div className="bg-muted/20">
            {block.disciplines.map((discipline, disciplineIndex) => (
              <div 
                key={discipline.id}
                className={`py-2 px-4 pl-8 ${
                  disciplineIndex % 2 === 0 ? 'bg-muted/10' : 'bg-background'
                } hover:bg-muted/30 transition-colors`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-0">
                  <div className="flex items-center flex-1 min-w-0 pr-2">
                    <Checkbox
                      checked={discipline.isCompleted || false}
                      onCheckedChange={() => handleToggleDiscipline(block.id, discipline.id)}
                      className="mt-0.5 mr-3 flex-shrink-0"
                    />
                    <span 
                      className={`font-medium text-foreground text-xs truncate ${discipline.isCompleted ? 'line-through opacity-60' : ''} ${allowEdit && onEditDiscipline ? 'cursor-pointer hover:text-primary' : ''}`}
                      onClick={allowEdit && onEditDiscipline ? (e) => {
                        e.stopPropagation();
                        onEditDiscipline(block.id, discipline.id);
                      } : undefined}
                      title={allowEdit && onEditDiscipline ? 'Clique para editar' : undefined}
                    >
                      {blockIndex + 1}.{disciplineIndex + 1}. {discipline.name}
                    </span>
                  </div>
                  {/* Status checkboxes - na mesma linha em telas maiores, abaixo em telas menores */}
                  <div className="flex items-center gap-1.5 sm:gap-3 sm:ml-auto sm:flex-shrink-0 text-xs flex-wrap sm:flex-nowrap">
                    {allowEdit && onRemoveDiscipline && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(`Tem certeza que deseja remover a disciplina "${discipline.name}"?`)) {
                            onRemoveDiscipline(block.id, discipline.id);
                          }
                        }}
                        title="Remover disciplina"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                    <label className="flex items-center gap-1 sm:gap-1.5 cursor-pointer whitespace-nowrap">
                      <Checkbox
                        checked={discipline.status === 'em_andamento'}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            handleStatusChange(block.id, discipline.id, 'em_andamento');
                          } else if (discipline.status === 'em_andamento') {
                            // Se desmarcar o status atual, remover o status
                            handleStatusChange(block.id, discipline.id, undefined as any);
                          }
                        }}
                        className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0"
                      />
                      <span className="text-muted-foreground text-xs">Em andamento</span>
                    </label>
                    <label className="flex items-center gap-1 sm:gap-1.5 cursor-pointer whitespace-nowrap">
                      <Checkbox
                        checked={discipline.status === 'finalizada'}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            handleStatusChange(block.id, discipline.id, 'finalizada');
                          } else if (discipline.status === 'finalizada') {
                            handleStatusChange(block.id, discipline.id, undefined as any);
                          }
                        }}
                        className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0"
                      />
                      <span className="text-muted-foreground text-xs">Finalizada</span>
                    </label>
                    <label className="flex items-center gap-1 sm:gap-1.5 cursor-pointer whitespace-nowrap">
                      <Checkbox
                        checked={discipline.status === 'em_revisao'}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            handleStatusChange(block.id, discipline.id, 'em_revisao');
                          } else if (discipline.status === 'em_revisao') {
                            handleStatusChange(block.id, discipline.id, undefined as any);
                          }
                        }}
                        className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0"
                      />
                      <span className="text-muted-foreground text-xs">Em revisão</span>
                    </label>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Bloquear acesso para usuários Free - DEPOIS de todos os hooks
  if (!isLoadingSubscription && !isPro) {
    return (
      <div className={className}>
        <ProFeatureGuard
          featureName="Edital Verticalizado"
        />
      </div>
    );
  }

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg font-bold text-center text-foreground">
          <BookOpen className="h-5 w-5" />
          Edital Verticalizado
        </CardTitle>
        
        {/* Estatísticas no Header */}
        {showProgress && blocks.length > 0 && (
          <div className="mt-4 p-4 bg-primary/5 rounded-lg border border-primary/20">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-xl font-bold text-primary">{totalDisciplines}</div>
                <div className="text-sm text-primary/80 font-medium">Total de Disciplinas</div>
              </div>
              <div>
                <div className="text-xl font-bold text-green-600 dark:text-green-400">{completedDisciplines}</div>
                <div className="text-sm text-green-600/80 dark:text-green-400/80 font-medium">Concluídas</div>
              </div>
              <div>
                <div className="text-xl font-bold text-orange-600 dark:text-orange-400">{progressPercentage}%</div>
                <div className="text-sm text-orange-600/80 dark:text-orange-400/80 font-medium">Progresso</div>
              </div>
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent className="p-0">
        <div className="bg-muted/30 rounded-lg overflow-hidden">
          {blocks.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">
              <BookOpen className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-sm">Nenhum bloco de estudo encontrado</p>
            </div>
          ) : (
            blocks.map((block, blockIndex) => renderBlock(block, blockIndex))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
