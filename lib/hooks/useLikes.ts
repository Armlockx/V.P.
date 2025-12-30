'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

export function useLikes(videoId: string | null) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (!videoId) return;
    loadLikes();
  }, [videoId]);

  const loadLikes = useCallback(async () => {
    if (!videoId) return;

    try {
      // Buscar likes do vídeo
      const { data: likes, error } = await supabase
        .from('video_likes')
        .select('*')
        .eq('video_id', videoId);

      if (error) throw error;

      setLikeCount(likes?.length || 0);

      // Verificar se usuário atual curtiu
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const userLike = likes?.find((like) => like.user_id === session.user.id);
        setLiked(!!userLike);
      }
    } catch (error) {
      console.error('Erro ao carregar likes:', error);
    }
  }, [videoId, supabase]);

  const toggleLike = useCallback(async () => {
    if (!videoId || loading) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      alert('Você precisa estar logado para curtir vídeos');
      return;
    }

    setLoading(true);

    try {
      if (liked) {
        // Remover like
        const { error } = await supabase
          .from('video_likes')
          .delete()
          .eq('video_id', videoId)
          .eq('user_id', session.user.id);

        if (error) throw error;
        setLiked(false);
        setLikeCount((prev) => Math.max(0, prev - 1));
      } else {
        // Adicionar like
        const { error } = await supabase
          .from('video_likes')
          .insert({
            video_id: videoId,
            user_id: session.user.id,
          });

        if (error) throw error;
        setLiked(true);
        setLikeCount((prev) => prev + 1);
      }
    } catch (error: any) {
      console.error('Erro ao curtir vídeo:', error);
      if (error.code === '23505') {
        // Like já existe, apenas atualizar estado
        setLiked(true);
      } else {
        alert('Erro ao curtir vídeo');
      }
    } finally {
      setLoading(false);
    }
  }, [videoId, liked, loading, supabase]);

  return {
    liked,
    likeCount,
    loading,
    toggleLike,
  };
}


