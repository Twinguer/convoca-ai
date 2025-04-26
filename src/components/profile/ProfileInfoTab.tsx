
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  // Limitar o tamanho do texto de perfil
  const handleProfileTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (e.target.value.length <= 100) {
      setProfileText(e.target.value);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nome completo</Label>
          <Input 
            id="name" 
            value={name} 
            onChange={(e) => setName(e.target.value)}
            placeholder="Seu nome completo"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input 
            id="email" 
            value={email} 
            disabled 
            className="bg-muted"
          />
        </div>
        
        <StatusSelect 
          value={statusConcurseiro}
          onChange={setStatusConcurseiro}
        />
        
        <div className="space-y-2">
          <Label htmlFor="profileText">Texto de perfil</Label>
          <Textarea 
            id="profileText" 
            value={profileText} 
            onChange={handleProfileTextChange}
            placeholder="Digite uma frase ou mensagem para mostrar em seu perfil"
            rows={2}
            maxLength={100}
          />
          <p className="text-xs text-muted-foreground">
            Este texto será exibido no seu cartão de perfil para outros usuários (máximo 100 caracteres)
            <span className="ml-1 font-medium">{profileText.length}/100</span>
          </p>
        </div>

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
        
        <div className="space-y-2">
          <Label htmlFor="bio">Biografia</Label>
          <Textarea 
            id="bio" 
            value={bio} 
            onChange={(e) => setBio(e.target.value)}
            placeholder="Conte um pouco sobre você e sua jornada nos concursos públicos"
            rows={4}
          />
        </div>
      </div>
    </div>
  );
};

export default ProfileInfoTab;
