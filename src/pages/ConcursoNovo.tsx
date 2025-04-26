
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trophy, ArrowLeft, Save } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const ConcursoNovo = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [titulo, setTitulo] = useState('');
  const [orgao, setOrgao] = useState('');
  const [banca, setBanca] = useState('');
  const [examType, setExamType] = useState('objective');
  const [alternativesCount, setAlternativesCount] = useState(5);
  const [status, setStatus] = useState('active');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  if (!user) {
    return (
      <div className="container mx-auto p-4 text-center py-12">
        <h2 className="text-2xl font-bold mb-2">Acesso não autorizado</h2>
        <p className="text-muted-foreground mb-6">
          Você precisa estar conectado para criar um ranking
        </p>
        <Button onClick={() => navigate('/auth')}>
          Fazer login
        </Button>
      </div>
    );
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!titulo || !orgao || !banca) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const { data, error } = await supabase.from('concursos').insert({
        titulo,
        orgao,
        banca,
        exam_type: examType,
        alternatives_count: alternativesCount,
        status,
        created_by_user_id: user.id,
        is_admin_created: false,
        data_publicacao: new Date().toISOString()
      }).select().single();
      
      if (error) throw error;
      
      toast({
        title: "Ranking criado com sucesso!",
        description: "Seu ranking foi criado e já está disponível para participação.",
      });
      
      navigate(`/concurso/${data.id}`);
    } catch (error: any) {
      console.error('Error creating ranking:', error);
      toast({
        title: "Erro ao criar ranking",
        description: error.message || "Ocorreu um erro ao criar o ranking. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="container mx-auto p-4 py-8">
      <div className="max-w-3xl mx-auto">
        <Button 
          variant="outline" 
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
        
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Trophy className="h-6 w-6 text-emerald-600" />
              <CardTitle>Criar Novo Ranking</CardTitle>
            </div>
            <CardDescription>
              Crie seu próprio ranking para comparar resultados com outros participantes
            </CardDescription>
          </CardHeader>
          
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="titulo">Título do Concurso/Seleção *</Label>
                <Input 
                  id="titulo" 
                  value={titulo} 
                  onChange={(e) => setTitulo(e.target.value)} 
                  placeholder="Ex: Analista Judiciário - TRT 4ª Região"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="orgao">Órgão/Instituição *</Label>
                <Input 
                  id="orgao" 
                  value={orgao} 
                  onChange={(e) => setOrgao(e.target.value)} 
                  placeholder="Ex: Tribunal Regional do Trabalho"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="banca">Banca Organizadora *</Label>
                <Input 
                  id="banca" 
                  value={banca} 
                  onChange={(e) => setBanca(e.target.value)} 
                  placeholder="Ex: CESPE, FCC, FGV"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="exam-type">Tipo de Prova</Label>
                <Select value={examType} onValueChange={setExamType}>
                  <SelectTrigger id="exam-type">
                    <SelectValue placeholder="Selecione o tipo de prova" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="objective">Objetiva</SelectItem>
                    <SelectItem value="objective_discursive">Objetiva e Discursiva</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="alternatives-count">Número de Alternativas</Label>
                <Select 
                  value={alternativesCount.toString()} 
                  onValueChange={(value) => setAlternativesCount(parseInt(value))}
                >
                  <SelectTrigger id="alternatives-count">
                    <SelectValue placeholder="Quantidade de alternativas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="4">4 alternativas (A-D)</SelectItem>
                    <SelectItem value="5">5 alternativas (A-E)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="draft">Rascunho</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            
            <CardFooter>
              <Button 
                type="submit" 
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>Criando ranking...</>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Criar Ranking
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default ConcursoNovo;
