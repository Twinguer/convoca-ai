import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Alert } from '@/components/ui/alert';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CriarCiclo from '@/pages/Estudos/CriarCiclo';

const CreateCycleForStudent = () => {
  const { studentId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  // ✅ Buscar nome do aluno
  const { data: studentInfo, isLoading: isStudentLoading } = useQuery({
    queryKey: ['student-info', studentId],
    queryFn: async () => {
      if (!studentId) return null;
      
      // Buscar dados do aluno na tabela users_profiles
      const { data, error } = await supabase
        .from('users_profiles')
        .select('name, email')
        .eq('id', studentId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!studentId,
  });

  // Verificar acesso ao aluno
  const { data: hasAccess, isLoading } = useQuery({
    queryKey: ['coach-has-access', user?.id, studentId],
    queryFn: async () => {
      if (!user?.id || !studentId) return false;
      
      const { data: coachProfile } = await supabase
        .from('coach_profiles')
        .select('student_relationships')
        .eq('coach_id', user.id)
        .single();
      
      const students = coachProfile?.student_relationships || [];
      return students.some((s: any) => s.student_id === studentId && s.status === 'active');
    },
    enabled: !!user && !!studentId,
  });

  // Provider para passar contexto do aluno para o CriarCiclo
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
            onClick={() => navigate(`/coach/student/${studentId}`)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Criar Ciclo de Estudo</h1>
            <p className="text-sm text-muted-foreground">
              Criando ciclo para: <span className="font-semibold text-foreground">
                {studentInfo?.name || studentInfo?.email || 'seu aluno'}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Renderizar CriarCiclo original */}
      <CriarCiclo 
        // Passar prop para indicar modo coach
        coachMode
        targetStudentId={studentId}
        onSuccess={() => navigate(`/coach/student/${studentId}`)}
      />
    </div>
  );
};

export default CreateCycleForStudent;