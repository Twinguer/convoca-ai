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
  setConcursosParticipando
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
          <Label htmlFor="name">Nome completo</Label>
          <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="Seu nome completo" />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" value={email} disabled className="bg-muted" />
        </div>
        
        <StatusSelect value={statusConcurseiro} onChange={setStatusConcurseiro} />
        
        

        <div className="space-y-3 border p-4 rounded-md bg-gray-50">
          <Label className="text-lg font-medium">Concursos em que foi aprovado</Label>
          
          <div className="flex gap-2">
            <Input placeholder="Adicionar aprovação (ex: Analista Administrativo - TCU)" value={novaAprovacao} onChange={e => setNovaAprovacao(e.target.value)} maxLength={50} className="flex-grow" />
            <Button onClick={adicionarAprovacao} type="button" className="bg-emerald-600 hover:bg-emerald-700 flex items-center">
              <Plus className="h-4 w-4 mr-1" /> Adicionar
            </Button>
          </div>
          
          <div className="space-y-2 mt-3">
            {listaAprovacoes.length > 0 ? listaAprovacoes.map((aprovacao, index) => <div key={index} className="flex items-center justify-between bg-white p-2 rounded border">
                  <span className="text-sm break-words flex-grow">{aprovacao}</span>
                  <Button variant="ghost" size="sm" onClick={() => removerAprovacao(index)} className="h-8 w-8 p-0">
                    <X className="h-4 w-4 text-gray-500" />
                  </Button>
                </div>) : <p className="text-sm text-gray-500 italic">Nenhuma aprovação adicionada ainda</p>}
          </div>
          
          
        </div>
        
        
        
        
      </div>
    </div>;
};
export default ProfileInfoTab;