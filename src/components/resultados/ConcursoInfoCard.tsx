
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, Calendar, Building, Award, User, Star } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface ConcursoInfoCardProps {
  concursoTitle: string;
  cargoTitle: string;
  banca: string;
  data: string;
  creatorName?: string;
  isAdminCreated?: boolean;
}

export const ConcursoInfoCard: React.FC<ConcursoInfoCardProps> = ({
  concursoTitle,
  cargoTitle,
  banca,
  data,
  creatorName,
  isAdminCreated
}) => {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col space-y-4">
          <div>
            <h2 className="text-2xl font-bold">{cargoTitle}</h2>
            <div className="flex flex-wrap items-center gap-1 text-muted-foreground mt-1">
              <Building className="h-4 w-4" />
              <span>{concursoTitle}</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-emerald-600" />
              <div>
                <p className="text-sm text-muted-foreground">Banca</p>
                <p className="font-medium">{banca}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-emerald-600" />
              <div>
                <p className="text-sm text-muted-foreground">Data da prova</p>
                <p className="font-medium">{formatDate(data)}</p>
              </div>
            </div>
            
            {(creatorName || isAdminCreated) && (
              <div className="flex items-center gap-2 col-span-1 md:col-span-2">
                <User className="h-5 w-5 text-emerald-600" />
                <div className="flex items-center">
                  <p className="text-sm text-muted-foreground mr-1">Criado por:</p>
                  <p className="font-medium flex items-center">
                    {isAdminCreated ? 'Admin' : creatorName || 'Usuário'}
                    {!isAdminCreated && creatorName && (
                      <Star className="h-3 w-3 ml-1 text-yellow-400" />
                    )}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
