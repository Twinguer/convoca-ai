
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import type { Ranking } from '@/services/rankingService';
import { Concurso } from '@/types/concursos';

interface RankingTableProps {
  rankings?: Ranking[];
  concurso?: Concurso;
  currentUserId?: string | null;
  isAuthenticated: boolean;
}

export const RankingTable: React.FC<RankingTableProps> = ({
  rankings,
  concurso,
  currentUserId,
  isAuthenticated
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Ampla Concorrência");
  
  // Get available quota types from concurso object
  const getAvailableQuotas = () => {
    if (!concurso) return ["Ampla Concorrência"];
    
    const quotas = ["Ampla Concorrência"]; // Ampla is always available
    
    if (concurso.has_ppp) {
      quotas.push("PPP");
    }
    
    if (concurso.has_pcd) {
      quotas.push("PCD");
    }
    
    if (concurso.has_hipossuficientes) {
      quotas.push("Hipossuficientes");
    }
    
    if (concurso.has_indigenas) {
      quotas.push("Indígenas");
    }
    
    if (concurso.has_transsexuais) {
      quotas.push("Pessoas Trans");
    }
    
    return quotas;
  };
  
  const availableQuotas = getAvailableQuotas();
  
  // Filter rankings by selected reservation type
  const filterRankingsByQuota = (quota: string) => {
    if (!rankings) return [];
    
    if (quota === "Ampla Concorrência") {
      // Everyone participates in Ampla Concorrência
      return rankings;
    }
    
    // For other quotas, filter by reservation_type
    return rankings.filter(ranking => ranking.reservationType === quota);
  };
  
  const handleUserClick = (userId: string) => {
    navigate(`/usuario/${userId}`);
  };

  if (!isAuthenticated) {
    return <Card>
        <CardHeader>
          <CardTitle>Classificação Pós-prova</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-gray-600 mb-6">Você precisa estar cadastrado para ver o Ranking.</p>
          <Button asChild>
            <Link to="/auth" className="flex items-center">
              <UserPlus className="mr-2 h-4 w-4" />
              Cadastrar-se
            </Link>
          </Button>
        </CardContent>
      </Card>;
  }
  
  // Display quota tabs only if there's more than one quota type available
  return <Card>
      <CardHeader>
        <CardTitle>Classificação Pós-prova</CardTitle>
      </CardHeader>
      <CardContent>
        {availableQuotas.length > 1 ? (
          <Tabs defaultValue="Ampla Concorrência" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-4 flex flex-wrap h-auto">
              {availableQuotas.map(quota => (
                <TabsTrigger key={quota} value={quota} className="text-sm">{quota}</TabsTrigger>
              ))}
            </TabsList>
            
            {availableQuotas.map(quota => (
              <TabsContent key={quota} value={quota}>
                <RankingTableContent 
                  rankings={filterRankingsByQuota(quota)} 
                  currentUserId={currentUserId} 
                  handleUserClick={handleUserClick}
                />
              </TabsContent>
            ))}
          </Tabs>
        ) : (
          <RankingTableContent 
            rankings={rankings || []} 
            currentUserId={currentUserId} 
            handleUserClick={handleUserClick}
          />
        )}
      </CardContent>
    </Card>;
};

// Extracted table content to a separate component for reuse
const RankingTableContent: React.FC<{
  rankings: Ranking[];
  currentUserId?: string | null;
  handleUserClick: (userId: string) => void;
}> = ({
  rankings,
  currentUserId,
  handleUserClick
}) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="text-center w-16">
            # 
          </TableHead>
          <TableHead>Candidato</TableHead>
          <TableHead className="text-right">
            Total 
          </TableHead>
          <TableHead className="text-right">
            C.B. 
          </TableHead>
          <TableHead className="text-right">
            C.E. 
          </TableHead>
          <TableHead className="text-right">
            Dis. 
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rankings && rankings.length > 0 ? rankings.map(ranking => (
          <TableRow key={ranking.userId} className={currentUserId && ranking.userId === currentUserId ? 'bg-muted' : ''}>
            <TableCell className="text-center font-bold">{ranking.position}º</TableCell>
            <TableCell>
              <div 
                className="flex items-center gap-2 cursor-pointer hover:text-emerald-600 transition-colors" 
                onClick={() => handleUserClick(ranking.userId)}
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={ranking.avatarUrl || undefined} alt={ranking.name} />
                  <AvatarFallback>{ranking.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <span>{ranking.name}</span>
              </div>
            </TableCell>
            <TableCell className="text-right font-medium">{ranking.score.toFixed(2)}</TableCell>
            <TableCell className="text-right">{ranking.basicKnowledgeScore?.toFixed(2) || '0.00'}</TableCell>
            <TableCell className="text-right">{ranking.specificKnowledgeScore?.toFixed(2) || '0.00'}</TableCell>
            <TableCell className="text-right">{ranking.discursiveScore?.toFixed(2) || '0.00'}</TableCell>
          </TableRow>
        )) : (
          <TableRow>
            <TableCell colSpan={6} className="text-center py-4">
              Nenhum participante registrado nesta lista ainda
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
};
