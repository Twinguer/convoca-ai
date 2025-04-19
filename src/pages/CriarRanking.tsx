
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import RankingForm from '@/components/shared/RankingForm';

const CriarRanking = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  const searchParams = new URLSearchParams(location.search);
  const editId = searchParams.get('edit');
  
  React.useEffect(() => {
    if (!user) {
      toast.error("Você precisa estar logado para criar um ranking");
      navigate("/auth");
    }
  }, [user, navigate]);

  return (
    <div>
      <Button 
        variant="ghost" 
        className="mb-4 flex items-center gap-2" 
        onClick={() => navigate('/pre-classificacao')}
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para Rankings
      </Button>
      
      <RankingForm editId={editId} />
    </div>
  );
};

export default CriarRanking;
