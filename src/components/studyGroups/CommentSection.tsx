import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageSquare, Send } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { useAddComment } from '@/hooks/useGroupPosts';
import type { GroupComment } from '@/types/studyGroups';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';

interface CommentSectionProps {
  postId: string;
  groupId: string;
  comments: GroupComment[];
  onCommentAdded?: () => void;
}

export const CommentSection: React.FC<CommentSectionProps> = ({
  postId,
  groupId,
  comments,
  onCommentAdded,
}) => {
  const { user } = useAuth();
  const addComment = useAddComment();
  const queryClient = useQueryClient();
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  // Debug: Log dos comentários
  React.useEffect(() => {
    console.log('CommentSection Debug:', {
      postId,
      commentsCount: comments?.length || 0,
      comments: comments || [],
    });
  }, [postId, comments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !user) return;

    setIsSubmitting(true);
    try {
      await addComment.mutateAsync({
        groupId,
        postId,
        content: commentText.trim(),
      });
      setCommentText('');
      if (onCommentAdded) {
        onCommentAdded();
      }
    } catch (error) {
      console.error('Erro ao adicionar comentário:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Organizar comentários (principais e respostas)
  const commentsArray = Array.isArray(comments) ? comments : [];
  const mainComments = commentsArray.filter(c => !c.parent_comment_id);
  const getReplies = (commentId: string) =>
    commentsArray.filter(c => c.parent_comment_id === commentId);

  // Debug adicional
  React.useEffect(() => {
    if (commentsArray.length > 0) {
      console.log('CommentSection - Comments array:', {
        total: commentsArray.length,
        main: mainComments.length,
        comments: commentsArray,
      });
    }
  }, [commentsArray.length, mainComments.length]);

  return (
    <div className="space-y-4">
      {/* Lista de comentários */}
      {mainComments.length > 0 ? (
        <div className="space-y-3">
          {mainComments.map((comment) => {
            const replies = getReplies(comment.id);
            return (
              <CommentItem
                key={comment.id}
                comment={comment}
                replies={replies}
                postId={postId}
                groupId={groupId}
                onCommentAdded={onCommentAdded}
              />
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-4">
          Nenhum comentário ainda. Seja o primeiro!
        </p>
      )}

      {/* Formulário de comentário */}
      {user && (
        <form onSubmit={handleSubmit} className="space-y-2">
          <Textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Escreva um comentário..."
            rows={3}
            className="resize-none"
          />
          <div className="flex justify-end">
            <Button
              type="submit"
              size="sm"
              disabled={!commentText.trim() || isSubmitting}
            >
              <Send className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Enviando...' : 'Comentar'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};

interface CommentItemProps {
  comment: GroupComment;
  replies: GroupComment[];
  postId: string;
  groupId: string;
  onCommentAdded?: () => void;
}

const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  replies,
  postId,
  groupId,
  onCommentAdded,
}) => {
  const timeAgo = formatDistanceToNow(new Date(comment.created_at), {
    addSuffix: true,
    locale: ptBR,
  });

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Avatar className="h-8 w-8">
          {comment.author_avatar ? (
            <AvatarImage src={comment.author_avatar} alt={comment.author_name || 'Usuário'} />
          ) : (
            <AvatarFallback>{getInitials(comment.author_name)}</AvatarFallback>
          )}
        </Avatar>
        <div className="flex-1">
          <div className="bg-muted rounded-lg p-3">
            <p className="text-xs font-semibold mb-1 text-muted-foreground">
              {comment.author_name || 'Usuário'}
            </p>
            <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
          </div>
          <p className="text-xs text-muted-foreground mt-1">{timeAgo}</p>
        </div>
      </div>

      {/* Respostas */}
      {replies.length > 0 && (
        <div className="ml-10 space-y-2 border-l-2 pl-4">
          {replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              replies={[]}
              postId={postId}
              groupId={groupId}
              onCommentAdded={onCommentAdded}
            />
          ))}
        </div>
      )}
    </div>
  );
};

