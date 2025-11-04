import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff } from 'lucide-react';

interface PrivacySettingsProps {
  settings: {
    showEmail: boolean;
    showBio: boolean;
    showState: boolean;
    showEducation: boolean;
    showCurrentJob: boolean;
    showStudyArea: boolean;
    showSpecialty: boolean;
    showPreparatoryCourse: boolean;
    showStudyRoutine: boolean;
    showApprovals: boolean;
  };
  onSettingChange: (setting: string, value: boolean) => void;
}

export const PrivacySettings: React.FC<PrivacySettingsProps> = ({
  settings,
  onSettingChange
}) => {
  const privacyItems = [
    { key: 'showEmail', label: 'Email', description: 'Mostrar meu email no perfil público' },
    { key: 'showBio', label: 'Biografia', description: 'Mostrar minha biografia' },
    { key: 'showState', label: 'Estado', description: 'Mostrar meu estado' },
    { key: 'showEducation', label: 'Formação', description: 'Mostrar minha formação acadêmica' },
    { key: 'showCurrentJob', label: 'Cargo atual', description: 'Mostrar meu cargo atual' },
    { key: 'showStudyArea', label: 'Área de estudos', description: 'Mostrar minha área de estudos' },
    { key: 'showSpecialty', label: 'Especialidade', description: 'Mostrar minha especialidade' },
    { key: 'showPreparatoryCode', label: 'Curso preparatório', description: 'Mostrar meu curso preparatório' },
    { key: 'showStudyRoutine', label: 'Rotina de estudos', description: 'Mostrar minha rotina de estudos' },
    { key: 'showApprovals', label: 'Aprovações', description: 'Mostrar minhas aprovações em concursos' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          Configurações de Privacidade
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {privacyItems.map((item) => (
          <div key={item.key} className="flex items-center justify-between space-x-2">
            <div className="flex flex-col flex-1">
              <Label htmlFor={item.key} className="text-sm font-medium">
                {item.label}
              </Label>
              <p className="text-xs text-muted-foreground">
                {item.description}
              </p>
            </div>
            <Switch
              id={item.key}
              checked={settings[item.key as keyof typeof settings]}
              onCheckedChange={(checked) => onSettingChange(item.key, checked)}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
};