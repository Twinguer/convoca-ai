
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ProfileInfoTab from './ProfileInfoTab';
import CombinedRankingsTab from './CombinedRankingsTab';

interface UserProfileContentProps {
  user: any;
  name: string;
  email: string;
  bio: string;
  statusConcurseiro: string;
  setStatusConcurseiro: (status: string) => void;
  profileText: string;
  setProfileText: (text: string) => void;
  setName: (name: string) => void;
  setBio: (bio: string) => void;
  concursosAprovados: string;
  setConcursosAprovados: (concursos: string) => void;
  concursosParticipando: string;
  setConcursosParticipando: (concursos: string) => void;
  userRankings: any[];
}

const UserProfileContent = ({
  user,
  name,
  email,
  bio,
  statusConcurseiro,
  setStatusConcurseiro,
  profileText,
  setProfileText,
  setName,
  setBio,
  concursosAprovados,
  setConcursosAprovados,
  concursosParticipando,
  setConcursosParticipando,
  userRankings
}: UserProfileContentProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Meu Perfil</CardTitle>
      </CardHeader>
      
      <Tabs defaultValue="profile">
        <div className="px-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profile">Perfil</TabsTrigger>
            <TabsTrigger value="rankings">Rankings</TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="profile">
          <CardContent className="pt-6">
            <ProfileInfoTab 
              name={name}
              setName={setName}
              email={email}
              bio={bio}
              setBio={setBio}
              statusConcurseiro={statusConcurseiro}
              setStatusConcurseiro={setStatusConcurseiro}
              profileText={profileText}
              setProfileText={setProfileText}
              concursosAprovados={concursosAprovados}
              setConcursosAprovados={setConcursosAprovados}
              concursosParticipando={concursosParticipando}
              setConcursosParticipando={setConcursosParticipando}
            />
          </CardContent>
        </TabsContent>
        
        <TabsContent value="rankings">
          <CardContent className="pt-6">
            <CombinedRankingsTab 
              userId={user?.id || ''}
              userRankings={userRankings}
              isAuthenticated={!!user}
            />
          </CardContent>
        </TabsContent>
      </Tabs>
    </Card>
  );
};

export default UserProfileContent;
