import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Alert } from '@/components/ui/alert';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CriarCiclo from '@/pages/Estudos/CriarCiclo';
import { UserUrlObfuscationService } from '@/services/userUrlObfuscation';
import { devLog } from '@/utils/productionLogger';
import { useToast } from '@/hooks/use-toast';

// Helper para verificar se é UUID válido
const isValidUUID = (str: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

const CreateCycleForStudent = () => {
  const { studentId: studentIdParam } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Estado para ID validado
  const [validatedStudentId, setValidatedStudentId] = useState<string | null>(null);
  const [isValidatingToken, setIsValidatingToken] = useState(false);

  // Validar token se necessário
  useEffect(() => {
    const validateId = async () => {
      if (!studentIdParam) return;

      setIsValidatingToken(true);
      
      try {
        let studentId: string;
        if (isValidUUID(studentIdParam)) {
          studentId = studentIdParam;
        } else {
          const validatedUserId = await UserUrlObfuscationService.validateUserToken(studentIdParam);
          if (!validatedUserId) {
            throw new Error('Token de aluno inválido');
          }
          studentId = validatedUserId;
        }

        setValidatedStudentId(studentId);
      } catch (error) {
        devLog.error('Erro ao validar token:', error);
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

    validateId();
  }, [studentIdParam, navigate, toast]);

  // ✅ Buscar nome do aluno
  const { data: studentInfo, isLoading: isStudentLoading } = useQuery({
    queryKey: ['student-info', validatedStudentId],
    queryFn: async () => {
      if (!validatedStudentId) return null;
      
      // Buscar dados do aluno na tabela users_profiles
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

  // ✅ SEGURANÇA: Validação no backend via RPC
  const { data: accessCheck, isLoading } = useQuery({
    queryKey: ['coach-has-access', user?.id, validatedStudentId],
    queryFn: async () => {
      if (!user?.id || !validatedStudentId) return null;
      
      const { data, error } = await supabase.rpc('check_coach_has_student_access', {
        p_coach_id: user.id,
        p_student_id: validatedStudentId,
      });

      if (error) {
        devLog.error('[CreateCycleForStudent] Erro ao verificar acesso:', error);
        throw error;
      }

      return data as { allowed: boolean; reason?: string; message?: string };
    },
    enabled: !!user && !!validatedStudentId,
    retry: 1,
  });

  const hasAccess = accessCheck?.allowed ?? false;

  // Provider para passar contexto do aluno para o CriarCiclo
  if (isValidatingToken || !validatedStudentId) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Validando acesso...</div>
      </div>
    );
  }

  if (isLoading || isStudentLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Carregando...</div>
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

  // Usar Context API para passar studentId para CriarCiclo
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
            <h1 className="text-2xl font-bold">Criar Ciclo de Estudo</h1>
            <p className="text-sm text-muted-foreground">
              Criando ciclo para: <span className="font-semibold text-foreground">
                {studentInfo?.name || studentInfo?.email?.split('@')[0] || 'seu aluno'}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Renderizar CriarCiclo original */}
      <CriarCiclo 
        // Passar prop para indicar modo coach
        coachMode
        targetStudentId={validatedStudentId}
        onSuccess={async () => {
          if (!validatedStudentId) return;
          try {
            const studentToken = await UserUrlObfuscationService.generateUserToken(validatedStudentId);
            navigate(`/coach/student/${studentToken}`);
          } catch (error) {
            devLog.error('Erro ao gerar URL segura:', error);
            navigate('/coach/dashboard');
          }
        }}
      />
    </div>
  );
};

export default CreateCycleForStudent;