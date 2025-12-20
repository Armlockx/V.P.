-- Script para configurar RLS e funções RPC para estatísticas de vídeos
-- Execute este script no SQL Editor do Supabase
-- IMPORTANTE: Execute este script COMPLETO no Supabase SQL Editor

-- ============================================
-- PARTE 1: Funções RPC (PRIORIDADE - BYPASS RLS)
-- ============================================
-- Funções RPC com SECURITY DEFINER bypassam RLS completamente
-- Isso garante que funcionem para usuários anônimos

-- Remover funções antigas se existirem
DROP FUNCTION IF EXISTS increment_video_views(UUID);
DROP FUNCTION IF EXISTS increment_video_watch_time(UUID, NUMERIC);

-- Função para incrementar views
CREATE OR REPLACE FUNCTION increment_video_views(video_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_views INTEGER;
BEGIN
    UPDATE videos
    SET views = COALESCE(views, 0) + 1
    WHERE id = video_id
    RETURNING views INTO new_views;
    
    RETURN COALESCE(new_views, 0);
END;
$$;

-- Função para incrementar watch_time
CREATE OR REPLACE FUNCTION increment_video_watch_time(video_id UUID, seconds NUMERIC)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_watch_time NUMERIC;
BEGIN
    UPDATE videos
    SET watch_time = COALESCE(watch_time, 0) + seconds
    WHERE id = video_id
    RETURNING watch_time INTO new_watch_time;
    
    RETURN COALESCE(new_watch_time, 0);
END;
$$;

-- Permitir que todos (incluindo anônimos) executem essas funções
GRANT EXECUTE ON FUNCTION increment_video_views(UUID) TO anon, authenticated, public;
GRANT EXECUTE ON FUNCTION increment_video_watch_time(UUID, NUMERIC) TO anon, authenticated, public;

-- ============================================
-- PARTE 2: Políticas RLS (FALLBACK)
-- ============================================
-- Permite que usuários autenticados E anônimos atualizem views e watch_time

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar views" ON videos;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar watch_time" ON videos;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar estatísticas" ON videos;
DROP POLICY IF EXISTS "Usuários anônimos podem atualizar estatísticas" ON videos;
DROP POLICY IF EXISTS "Todos podem atualizar estatísticas" ON videos;

-- Habilitar RLS na tabela videos se ainda não estiver habilitado
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

-- IMPORTANTE: Política RLS de UPDATE removida para maior segurança
-- A atualização de estatísticas (views e watch_time) deve ser feita APENAS via funções RPC:
--   - increment_video_views(video_id)
--   - increment_video_watch_time(video_id, seconds)
-- 
-- As funções RPC usam SECURITY DEFINER e bypassam RLS de forma controlada,
-- garantindo que apenas incrementos sejam permitidos, não atualizações arbitrárias.
--
-- REMOVER política permissiva se existir (execute no SQL Editor do Supabase):
-- DROP POLICY IF EXISTS "Todos podem atualizar estatísticas" ON videos;
--
-- Se você precisa de uma política RLS como fallback, use uma política mais restritiva:
-- CREATE POLICY "Todos podem atualizar apenas views e watch_time"
-- ON videos
-- FOR UPDATE
-- TO public
-- USING (true)
-- WITH CHECK (
--     -- Garantir que apenas views e watch_time possam ser atualizados
--     -- (outros campos devem permanecer iguais)
--     OLD.title = NEW.title AND
--     OLD.url = NEW.url AND
--     OLD.thumbnail_url = NEW.thumbnail_url AND
--     OLD.duration = NEW.duration AND
--     OLD.created_at = NEW.created_at AND
--     OLD.user_id = NEW.user_id
-- );

-- Garantir que todos podem ler a tabela videos (necessário para SELECT)
DROP POLICY IF EXISTS "Todos podem ler videos" ON videos;
CREATE POLICY "Todos podem ler videos"
ON videos
FOR SELECT
TO public
USING (true);

-- ============================================
-- PARTE 3: Políticas para Likes e Comentários
-- ============================================

-- Habilitar RLS nas tabelas de likes e comentários se necessário
ALTER TABLE IF EXISTS video_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS video_comments ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Todos podem ler likes" ON video_likes;
DROP POLICY IF EXISTS "Usuários podem ler likes" ON video_likes;
DROP POLICY IF EXISTS "Anônimos podem ler likes" ON video_likes;
DROP POLICY IF EXISTS "Todos podem ler comentários" ON video_comments;
DROP POLICY IF EXISTS "Usuários podem ler comentários" ON video_comments;
DROP POLICY IF EXISTS "Anônimos podem ler comentários" ON video_comments;

-- Permitir que todos (incluindo anônimos) leiam likes
CREATE POLICY "Todos podem ler likes"
ON video_likes
FOR SELECT
TO public
USING (true);

-- Permitir que todos (incluindo anônimos) leiam comentários
CREATE POLICY "Todos podem ler comentários"
ON video_comments
FOR SELECT
TO public
USING (true);

-- Políticas específicas para anon como fallback
CREATE POLICY "Anônimos podem ler likes"
ON video_likes
FOR SELECT
TO anon
USING (true);

CREATE POLICY "Anônimos podem ler comentários"
ON video_comments
FOR SELECT
TO anon
USING (true);

-- ============================================
-- VERIFICAÇÃO FINAL
-- ============================================
-- Execute estas queries para verificar se tudo está funcionando:

-- Verificar se as funções foram criadas:
-- SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public' AND routine_name IN ('increment_video_views', 'increment_video_watch_time');

-- Verificar políticas RLS:
-- SELECT schemaname, tablename, policyname FROM pg_policies WHERE tablename IN ('videos', 'video_likes', 'video_comments');
