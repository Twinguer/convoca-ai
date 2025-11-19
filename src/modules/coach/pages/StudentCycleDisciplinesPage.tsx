import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Alert } from '@/components/ui/alert';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CicloDetalhes from '@/pages/Estudos/CicloDetalhes';
import { devLog } from '@/utils/productionLogger';
import { useToast } from '@/hooks/use-toast';

// Helper para verificar se é UUID válido
const isValidUUID = (str: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

const StudentCycleDisciplinesPage = () => {
  const { studentId: studentIdParam, cycleId: cycleIdParam } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Estado para IDs validados
  const [validatedStudentId, setValidatedStudentId] = useState<string | null>(null);
  const [validatedCycleId, setValidatedCycleId] = useState<string | null>(null);
  const [isValidatingToken, setIsValidatingToken] = useState(false);

  // Validar tokens se necessário
  useEffect(() => {
    const validateIds = async () => {
      if (!studentIdParam || !cycleIdParam) return;

      setIsValidatingToken(true);
      
      try {
        // Validar studentId
        let studentId: string;
        if (isValidUUID(studentIdParam)) {
          studentId = studentIdParam;
        } else {
          const { UserUrlObfuscationService } = await import('@/services/userUrlObfuscation');
          const validatedUserId = await UserUrlObfuscationService.validateUserToken(studentIdParam);
          if (!validatedUserId) {
            throw new Error('Token de aluno inválido');
          }
          studentId = validatedUserId;
        }

        // Validar cycleId
        let cycleId: string;
        if (isValidUUID(cycleIdParam)) {
          cycleId = cycleIdParam;
        } else {
          const { StudyCycleUrlObfuscationService } = await import('@/services/studyCycleUrlObfuscation');
          const validatedCycle = await StudyCycleUrlObfuscationService.validateStudyCycleToken(cycleIdParam, studentId);
          if (!validatedCycle) {
            throw new Error('Token de ciclo inválido');
          }
          cycleId = validatedCycle;
        }

        setValidatedStudentId(studentId);
        setValidatedCycleId(cycleId);
      } catch (error) {
        devLog.error('Erro ao validar tokens:', error);
        toast({
          title: 'Erro',
          description: 'Token de acesso inválido ou expirado.',
          variant: 'destructive'
        });
        navigate('/coach/dashboard');
      } finally {
        setIsValidatingToken(false);
      }
    };

    validateIds();
  }, [studentIdParam, cycleIdParam, navigate, toast]);

  // Buscar dados do aluno
  const { data: studentInfo, isLoading: isStudentLoading } = useQuery({
    queryKey: ['student-info', validatedStudentId],
    queryFn: async () => {
      if (!validatedStudentId) return null;
      
      const { data, error } = await supabase
        .from('users_profiles')
        .select('name, email')
        .eq('id', validatedStudentId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!validatedStudentId,
  });

  // Verificar se o coach tem acesso ao aluno
  const { data: hasAccess, isLoading } = useQuery({
    queryKey: ['coach-has-access', user?.id, validatedStudentId],
    queryFn: async () => {
      if (!user?.id || !validatedStudentId) return false;
      
      const { data: coachProfile } = await supabase
        .from('coach_profiles')
        .select('student_relationships')
        .eq('coach_id', user.id)
        .single();
      
      const students = coachProfile?.student_relationships || [];
      return students.some((s: any) => s.student_id === validatedStudentId && s.status === 'active');
    },
    enabled: !!user && !!validatedStudentId,
  });

  if (isValidatingToken || !validatedStudentId || !validatedCycleId) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Validando acesso...</div>
      </div>
    );
  }

  if (isLoading || isStudentLoading) {
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
          <p>Você não tem acesso a este aluno ou o aluno não faz parte da sua equipe</p>
        </Alert>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Header customizado para modo coach */}
      <div className="sticky top-0 z-10 bg-background border-b mb-4 p-4">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={async () => {
              if (!validatedStudentId) return;
              try {
                const { UserUrlObfuscationService } = await import('@/services/userUrlObfuscation');
                const studentToken = await UserUrlObfuscationService.generateUserToken(validatedStudentId);
                navigate(`/coach/student/${studentToken}`);
              } catch (error) {
                devLog.error('Erro ao gerar URL segura:', error);
                navigate('/coach/dashboard');
              }
            }}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Disciplinas do Ciclo</h1>
            <p className="text-sm text-muted-foreground">
              Visualizando disciplinas de: <span className="font-semibold text-foreground">
                {studentInfo?.name || studentInfo?.email || 'seu aluno'}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Renderizar CicloDetalhes com props para modo coach */}
      <CicloDetalhes 
        cycleId={validatedCycleId}
        coachMode
        targetStudentId={validatedStudentId}
      />
    </div>
  );
};

export default StudentCycleDisciplinesPage;
