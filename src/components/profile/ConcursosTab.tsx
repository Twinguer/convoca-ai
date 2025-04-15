
import React from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface ConcursosTabProps {
  concursosAprovados: string;
  setConcursosAprovados: (value: string) => void;
  concursosParticipando: string;
  setConcursosParticipando: (value: string) => void;
}

const ConcursosTab: React.FC<ConcursosTabProps> = ({
  concursosAprovados,
  setConcursosAprovados,
  concursosParticipando,
  setConcursosParticipando
}) => {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="concursos-aprovados">Concursos em que foi aprovado</Label>
        <Textarea 
          id="concursos-aprovados" 
          value={concursosAprovados} 
          onChange={(e) => setConcursosAprovados(e.target.value)}
          placeholder="Liste os concursos em que você foi aprovado (um por linha)"
          rows={5}
        />
        <p className="text-sm text-muted-foreground">
          Dica: Liste um por linha, incluindo o nome do concurso, órgão, ano e sua classificação
        </p>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="concursos-participando">Concursos em que está participando</Label>
        <Textarea 
          id="concursos-participando" 
          value={concursosParticipando} 
          onChange={(e) => setConcursosParticipando(e.target.value)}
          placeholder="Liste os concursos em que você está participando atualmente (um por linha)"
          rows={5}
        />
        <p className="text-sm text-muted-foreground">
          Dica: Liste um por linha, incluindo o nome do concurso, órgão e data da prova
        </p>
      </div>
    </div>
  );
};

export default ConcursosTab;
