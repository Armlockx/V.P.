'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface Comment {
  id: string;
  video_id: string;
  user_id: string;
  comment_text: string;
  created_at: string;
  profiles?: {
    username: string;
    avatar_url: string | null;
  };
}

export function useComments(videoId: string | null) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (!videoId) return;
    loadComments();
  }, [videoId]);

  const loadComments = useCallback(async () => {
    if (!videoId) return;

    try {
      // Primeiro buscar comentários
      const { data: commentsData, error: commentsError } = await supabase
        .from('video_comments')
        .select('*')
        .eq('video_id', videoId)
        .order('created_at', { ascending: false });

      if (commentsError) throw commentsError;

      if (commentsData && commentsData.length > 0) {
        // Buscar perfis dos usuários
        const userIds = [...new Set(commentsData.map(c => c.user_id))];
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, username, avatar_url')
          .in('id', userIds);

        // Combinar comentários com perfis
        const commentsWithProfiles = commentsData.map(comment => ({
          ...comment,
          profiles: profilesData?.find(p => p.id === comment.user_id) || null,
        }));

        setComments(commentsWithProfiles as Comment[]);
      } else {
        setComments([]);
      }
    } catch (error) {
      console.error('Erro ao carregar comentários:', error);
      setComments([]);
    }
  }, [videoId, supabase]);

  const addComment = useCallback(async (content: string) => {
    if (!videoId || !content.trim() || loading) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      alert('Você precisa estar logado para comentar');
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('video_comments')
        .insert({
          video_id: videoId,
          user_id: session.user.id,
          comment_text: content.trim(),
        })
        .select('*')
        .single();

      if (error) throw error;
      
      if (data) {
        // Buscar perfil do usuário
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, username, avatar_url')
          .eq('id', session.user.id)
          .single();

        const commentWithProfile = {
          ...data,
          profiles: profile || null,
        };

        setComments((prev) => [commentWithProfile as Comment, ...prev]);
      }
    } catch (error) {
      console.error('Erro ao adicionar comentário:', error);
      alert('Erro ao adicionar comentário');
    } finally {
      setLoading(false);
    }
  }, [videoId, loading, supabase]);

  const deleteComment = useCallback(async (commentId: string) => {
    if (!commentId || loading) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    setLoading(true);

    try {
      // Verificar se o comentário pertence ao usuário
      const { data: comment } = await supabase
        .from('video_comments')
        .select('user_id')
        .eq('id', commentId)
        .single();

      if (comment?.user_id !== session.user.id) {
        alert('Você não tem permissão para excluir este comentário');
        return;
      }

      const { error } = await supabase
        .from('video_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (error) {
      console.error('Erro ao excluir comentário:', error);
      alert('Erro ao excluir comentário');
    } finally {
      setLoading(false);
    }
  }, [loading, supabase]);

  return {
    comments,
    loading,
    addComment,
    deleteComment,
    refreshComments: loadComments,
  };
}


