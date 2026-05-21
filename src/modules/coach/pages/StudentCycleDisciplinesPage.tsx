import React from 'react';
import { useParams } from 'react-router-dom';
import { Alert } from '@/components/ui/alert';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CicloDetalhes from '@/pages/Estudos/CicloDetalhes';
import { useCoachStudentGate } from '@/modules/coach/hooks/useCoachStudentGate';

const StudentCycleDisciplinesPage = () => {
  const { studentId: studentIdParam, cycleId: cycleIdParam } = useParams();
  const {
    validatedStudentId,
    validatedCycleId,
    isValidatingToken,
    isResolvingCycleToken,
    isCycleReady,
    hasAccess,
    isCheckingAccess,
    accessDeniedMessage,
    displayName,
    navigateToStudent,
  } = useCoachStudentGate({ studentIdParam, cycleIdParam });

  if (isValidatingToken || !validatedStudentId) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Validando acesso...</div>
      </div>
    );
  }

  if (isCheckingAccess) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Verificando acesso...</div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <p>{accessDeniedMessage}</p>
        </Alert>
      </div>
    );
  }

  if (isResolvingCycleToken || !isCycleReady || !validatedCycleId) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Validando ciclo de estudos...</div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="sticky top-0 z-10 bg-background border-b mb-4 p-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigateToStudent()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Disciplinas do Ciclo</h1>
            <p className="text-sm text-muted-foreground">
              Visualizando disciplinas de:{' '}
              <span className="font-semibold text-foreground">{displayName}</span>
            </p>
          </div>
        </div>
      </div>

      <CicloDetalhes
        cycleId={validatedCycleId}
        coachMode
        targetStudentId={validatedStudentId}
      />
    </div>
  );
};

export default StudentCycleDisciplinesPage;
