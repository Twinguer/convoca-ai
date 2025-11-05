import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { coachRelationshipService } from '@/integrations/supabase/coach/relationships';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Send, Search, User } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useDebounce } from '@/hooks/useDebounce';

const InviteStudentPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [studentNickname, setStudentNickname] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Buscar assinatura do coach
  const { data: subscription } = useQuery({
    queryKey: ['coach-subscription', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('coach_subscriptions')
        .select('*')
        .eq('coach_id', user.id)
        .eq('status', 'active')
        .single();
      return data;
    },
    enabled: !!user
  });

  // Buscar usuários por nickname
  const { data: searchResults = [], isLoading: isSearching } = useQuery({
    queryKey: ['search-users-by-nickname', debouncedSearchQuery],
    queryFn: async () => {
      if (!debouncedSearchQuery || debouncedSearchQuery.length < 3) return [];
      
      const cleanQuery = debouncedSearchQuery.toLowerCase().replace(/^@/, '').trim();
      
      const { data, error } = await supabase
        .from('users_profiles')
        .select('id, name, nickname, avatar_url')
        .ilike('nickname', `%${cleanQuery}%`)
        .limit(10);
      
      if (error) {
        console.error('Error searching users:', error);
        return [];
      }
      
      return data || [];
    },
    enabled: !!debouncedSearchQuery && debouncedSearchQuery.length >= 3
  });

  const handleInviteStudent = async () => {
    if (!user?.id) return;
    
    const nicknameToUse = selectedUser?.nickname || studentNickname;
    
    if (!nicknameToUse) {
      toast({
        title: 'Nickname necessário',
        description: 'Por favor, informe o nickname do aluno ou selecione um usuário',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);

    try {
      // Usar a função RPC que cria convite e envia notificação
      const { data, error } = await supabase.rpc('send_coach_invitation', {
        p_coach_id: user.id,
        p_student_nickname: nicknameToUse,
        p_invitation_message: message || null
      });

      if (error) {
        throw error;
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Erro ao enviar convite');
      }

      const studentName = selectedUser?.name || nicknameToUse;
      toast({
        title: 'Convite enviado!',
        description: `${studentName} recebeu seu convite por email e notificação`,
      });

      // Atualizar cache
      queryClient.invalidateQueries({ queryKey: ['coach-students'] });
      queryClient.invalidateQueries({ queryKey: ['coach-can-invite'] });

      // Voltar para dashboard
      navigate('/coach/dashboard');

    } catch (error: any) {
      console.error('Erro ao convidar aluno:', error);
      toast({
        title: 'Erro ao convidar',
        description: error.message || 'Não foi possível convidar o aluno',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectUser = (user: any) => {
    setSelectedUser(user);
    setStudentNickname(user.nickname);
    setSearchQuery('');
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/coach/dashboard')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Convidar Aluno</h1>
          <p className="text-muted-foreground">
            Adicione um aluno à sua equipe para acompanhar seus estudos
          </p>
        </div>
      </div>

      {/* Info sobre assinatura */}
      {subscription && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Seu Plano: {subscription.plan_type}</CardTitle>
            <CardDescription>
              {subscription.current_students} de {subscription.max_students} alunos cadastrados
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Formulário de Convite */}
      <Card>
        <CardHeader>
          <CardTitle>Informações do Aluno</CardTitle>
          <CardDescription>
            Digite o nickname do aluno ou busque na lista abaixo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Busca de usuários */}
          <div className="space-y-2">
            <Label htmlFor="search">Buscar Aluno</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                type="text"
                placeholder="@nickname ou nome..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                disabled={isLoading}
                className="pl-10"
              />
            </div>
            
            {/* Resultados da busca */}
            {searchQuery && searchResults.length > 0 && (
              <div className="border rounded-lg max-h-60 overflow-y-auto mt-2">
                {searchResults.map((user: any) => (
                  <div
                    key={user.id}
                    onClick={() => handleSelectUser(user)}
                    className="flex items-center gap-3 p-3 hover:bg-muted cursor-pointer transition-colors"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.avatar_url || undefined} />
                      <AvatarFallback>
                        {user.name?.charAt(0).toUpperCase() || <User className="h-5 w-5" />}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{user.name}</p>
                      <p className="text-sm text-muted-foreground">@{user.nickname}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {searchQuery && isSearching && (
              <p className="text-sm text-muted-foreground">Buscando...</p>
            )}
            
            {searchQuery && !isSearching && searchResults.length === 0 && debouncedSearchQuery.length >= 3 && (
              <p className="text-sm text-muted-foreground">Nenhum usuário encontrado</p>
            )}
          </div>

          {/* Campo de nickname (manual) */}
          <div className="space-y-2">
            <Label htmlFor="nickname">Nickname do Aluno</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">@</span>
              <Input
                id="nickname"
                type="text"
                placeholder="nickname"
                value={studentNickname}
                onChange={(e) => {
                  const value = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
                  setStudentNickname(value);
                  setSelectedUser(null);
                }}
                disabled={isLoading}
                className="pl-8"
                maxLength={20}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              {selectedUser ? (
                <span className="text-green-600">✓ {selectedUser.name} selecionado</span>
              ) : (
                'Apenas letras minúsculas, números e underscore (3-20 caracteres)'
              )}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Mensagem (Opcional)</Label>
            <Textarea
              id="message"
              placeholder="Olá! Gostaria de te acompanhar na sua preparação..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={isLoading}
              rows={4}
            />
          </div>

          {/* Alertas de Permissões */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
            <h4 className="font-semibold text-blue-900">O que você terá acesso:</h4>
            <ul className="space-y-1 text-sm text-blue-800">
              <li>✅ Módulo de estudos (horas, sessões)</li>
              <li>✅ Estatísticas gerais</li>
              <li>✅ Ciclos de estudo ativos</li>
              <li>✅ Progresso nos estudos</li>
            </ul>
            
            <div className="pt-2">
              <h4 className="font-semibold text-red-900">O que você NÃO terá acesso:</h4>
              <ul className="space-y-1 text-sm text-red-800">
                <li>❌ Rankings e respostas</li>
                <li>❌ Dados de provas específicas</li>
                <li>❌ Perfil completo do aluno</li>
              </ul>
            </div>
          </div>

          {/* Botões */}
          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => navigate('/coach/dashboard')}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleInviteStudent}
              disabled={isLoading || (!studentNickname && !selectedUser)}
            >
              {isLoading ? (
                'Enviando...'
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Convidar Aluno
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InviteStudentPage;

