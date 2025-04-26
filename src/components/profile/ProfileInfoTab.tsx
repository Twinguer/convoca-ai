
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
}

const ProfileInfoTab: React.FC<ProfileInfoTabProps> = ({
  name,
  setName,
  email,
  bio,
  setBio,
  statusConcurseiro,
  setStatusConcurseiro
}) => {
  return (
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
  );
};

export default ProfileInfoTab;
