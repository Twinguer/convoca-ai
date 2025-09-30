import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';
import StatusSelect from './StatusSelect';
interface ProfileInfoTabProps {
  name: string;
  setName: (name: string) => void;
  email: string;
  bio: string;
  setBio: (bio: string) => void;
  statusConcurseiro: string;
  setStatusConcurseiro: (status: string) => void;
  profileText: string;
  setProfileText: (text: string) => void;
  concursosAprovados: string;
  setConcursosAprovados: (value: string) => void;
  concursosParticipando: string;
  setConcursosParticipando: (value: string) => void;
  estado: string;
  setEstado: (value: string) => void;
  formacao: string;
  setFormacao: (value: string) => void;
  cargoAtual: string;
  setCargoAtual: (value: string) => void;
  areaEstudos: string;
  setAreaEstudos: (value: string) => void;
  especialidade: string;
  setEspecialidade: (value: string) => void;
  cursoPreparatorio: string;
  setCursoPreparatorio: (value: string) => void;
  rotinaEstudos: string;
  setRotinaEstudos: (value: string) => void;
}
const ProfileInfoTab: React.FC<ProfileInfoTabProps> = ({
  name,
  setName,
  email,
  bio,
  setBio,
  statusConcurseiro,
  setStatusConcurseiro,
  profileText,
  setProfileText,
  concursosAprovados,
  setConcursosAprovados,
  concursosParticipando,
  setConcursosParticipando,
  estado,
  setEstado,
  formacao,
  setFormacao,
  cargoAtual,
  setCargoAtual,
  areaEstudos,
  setAreaEstudos,
  especialidade,
  setEspecialidade,
  cursoPreparatorio,
  setCursoPreparatorio,
  rotinaEstudos,
  setRotinaEstudos
}) => {
  // Estado para nova aprovação
  const [novaAprovacao, setNovaAprovacao] = useState('');

  // Lista de aprovações
  const listaAprovacoes = concursosAprovados ? concursosAprovados.split('\n').filter(Boolean) : [];

  // Limitar o tamanho do texto de perfil
  const handleProfileTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (e.target.value.length <= 100) {
      setProfileText(e.target.value);
    }
  };

  // Limitar o tamanho do texto de rotina de estudos
  const handleRotinaEstudosChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (e.target.value.length <= 1500) {
      setRotinaEstudos(e.target.value);
    }
  };

  // Adicionar nova aprovação
  const adicionarAprovacao = () => {
    if (novaAprovacao.trim()) {
      const novaLista = [...listaAprovacoes, novaAprovacao.trim()].join('\n');
      setConcursosAprovados(novaLista);
      setNovaAprovacao('');
    }
  };

  // Remover uma aprovação
  const removerAprovacao = (index: number) => {
    const novaLista = listaAprovacoes.filter((_, i) => i !== index);
    setConcursosAprovados(novaLista.join('\n'));
  };
  return <div className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nome de usuário</Label>
          <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="Seu nome completo" />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" value={email} disabled className="bg-muted" />
        </div>
        
        <StatusSelect value={statusConcurseiro} onChange={setStatusConcurseiro} />

        <div className="space-y-2">
          <Label htmlFor="rotinaEstudos">Rotina de estudos</Label>
          <Textarea id="rotinaEstudos" value={rotinaEstudos} onChange={handleRotinaEstudosChange} placeholder="Rotina de estudos, próximo concursos, dicas... algo que ajude e incentive quem também está na jornada!" className="min-h-[150px]" />
          <p className="text-xs text-gray-500 text-right">{rotinaEstudos.length}/1500 caracteres</p>
        </div>
        
        <div className="space-y-2">
          <h3 className="text-lg font-medium">Sobre mim</h3>
          
          <div className="space-y-2 border p-4 rounded-md bg-secondary">
            <div className="space-y-2">
              <Label htmlFor="estado">Estado</Label>
              <Input id="estado" value={estado} onChange={e => setEstado(e.target.value)} placeholder="Seu estado" maxLength={50} />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="formacao">Formação</Label>
              <Input id="formacao" value={formacao} onChange={e => setFormacao(e.target.value)} placeholder="Sua formação acadêmica" maxLength={50} />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="cargoAtual">Cargo atual</Label>
              <Input id="cargoAtual" value={cargoAtual} onChange={e => setCargoAtual(e.target.value)} placeholder="Analista Judiciário, Autônomo, Estudante etc." maxLength={50} />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="areaEstudos">Área de Estudos</Label>
              <Input id="areaEstudos" value={areaEstudos} onChange={e => setAreaEstudos(e.target.value)} placeholder="Sefaz, Tribunais etc." maxLength={50} />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="especialidade">Especialidade</Label>
              <Input id="especialidade" value={especialidade} onChange={e => setEspecialidade(e.target.value)} placeholder="Área Judiciária, Tecnologia da Informação etc." maxLength={50} />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="cursoPreparatorio">Curso Preparatório</Label>
              <Input id="cursoPreparatorio" value={cursoPreparatorio} onChange={e => setCursoPreparatorio(e.target.value)} placeholder="Pode ser mais de um" maxLength={50} />
            </div>
          </div>
        </div>

        <div className="space-y-3 border p-4 rounded-md bg-secondary">
          <Label className="text-lg font-medium">Concursos em que foi aprovado</Label>
          
          <div className="flex gap-2">
            <Input placeholder="Adicionar aprovação (ex: Analista Administrativo - TCU)" value={novaAprovacao} onChange={e => setNovaAprovacao(e.target.value)} maxLength={50} className="flex-grow" />
            <Button onClick={adicionarAprovacao} type="button" className="bg-primary hover:bg-primary/90 flex items-center">
              <Plus className="h-4 w-4 mr-1" /> Adicionar
            </Button>
          </div>
          
          <div className="space-y-2 mt-3">
            {listaAprovacoes.length > 0 ? listaAprovacoes.map((aprovacao, index) => <div key={index} className="flex items-center justify-between bg-background p-2 rounded border border-border">
                  <span className="text-sm break-words flex-grow text-foreground">{aprovacao}</span>
                  <Button variant="ghost" size="sm" onClick={() => removerAprovacao(index)} className="h-8 w-8 p-0">
                    <X className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>) : <p className="text-sm text-muted-foreground italic">Nenhuma aprovação adicionada ainda</p>}
          </div>
        </div>
      </div>
    </div>;
};
export default ProfileInfoTab;