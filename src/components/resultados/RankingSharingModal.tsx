
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, Copy, Share2, Twitter, Facebook } from 'lucide-react';
import { toast } from 'sonner';

interface RankingSharingModalProps {
  isOpen: boolean;
  onClose: () => void;
  concurso?: any;
  userRanking?: any;
}

const RankingSharingModal: React.FC<RankingSharingModalProps> = ({
  isOpen,
  onClose,
  concurso,
  userRanking
}) => {
  const [copied, setCopied] = useState(false);
  
  const shareUrl = window.location.href;
  
  const shareText = userRanking 
    ? `🏆 Estou em ${userRanking.position}º lugar no ranking do concurso ${concurso?.titulo} (${concurso?.orgao}) com ${userRanking.score.toFixed(2)} pontos! Confira em: ${shareUrl}`
    : `📊 Confira os rankings do concurso ${concurso?.titulo} (${concurso?.orgao}) em: ${shareUrl}`;
    
  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    toast.success('Texto copiado para a área de transferência');
    
    setTimeout(() => {
      setCopied(false);
    }, 3000);
  };
  
  const handleShareTwitter = () => {
    const encodedText = encodeURIComponent(shareText);
    window.open(`https://twitter.com/intent/tweet?text=${encodedText}`, '_blank');
  };
  
  const handleShareFacebook = () => {
    const encodedUrl = encodeURIComponent(shareUrl);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`, '_blank');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Share2 className="w-5 h-5 mr-2" />
            Compartilhar Ranking
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              Compartilhe sua classificação ou o ranking completo com seus amigos
            </p>
            
            <div className="flex items-center space-x-2">
              <Input 
                value={shareText}
                readOnly
                className="flex-1"
              />
              <Button size="icon" onClick={handleCopyToClipboard} variant="outline">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          
          <div className="space-y-2">
            <p className="text-sm font-medium">Compartilhar em redes sociais:</p>
            <div className="flex space-x-2">
              <Button onClick={handleShareTwitter} variant="outline">
                <Twitter className="h-4 w-4 mr-2" />
                Twitter
              </Button>
              <Button onClick={handleShareFacebook} variant="outline">
                <Facebook className="h-4 w-4 mr-2" />
                Facebook
              </Button>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RankingSharingModal;
