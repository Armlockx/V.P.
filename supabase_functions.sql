-- Script para configurar RLS e funções RPC para estatísticas de vídeos
-- Execute este script no SQL Editor do Supabase

-- ============================================
-- OPÇÃO 1: Políticas RLS (RECOMENDADO)
-- ============================================
-- Permite que usuários autenticados atualizem views e watch_time

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar views" ON videos;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar watch_time" ON videos;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar estatísticas" ON videos;

-- Criar política que permite UPDATE de views e watch_time para usuários autenticados
CREATE POLICY "Usuários autenticados podem atualizar estatísticas"
ON videos
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Se preferir políticas mais específicas (apenas views e watch_time):
-- CREATE POLICY "Usuários autenticados podem atualizar views"
-- ON videos
-- FOR UPDATE
-- TO authenticated
-- USING (true)
-- WITH CHECK (true);

-- ============================================
-- OPÇÃO 2: Funções RPC (ALTERNATIVA)
-- ============================================
-- Descomente as linhas abaixo se preferir usar funções RPC

-- Função para incrementar views
-- CREATE OR REPLACE FUNCTION increment_video_views(video_id UUID)
-- RETURNS INTEGER
-- LANGUAGE plpgsql
-- SECURITY DEFINER
-- AS $$
-- DECLARE
--     new_views INTEGER;
-- BEGIN
--     UPDATE videos
--     SET views = COALESCE(views, 0) + 1
--     WHERE id = video_id
--     RETURNING views INTO new_views;
--     
--     RETURN COALESCE(new_views, 0);
-- END;
-- $$;

-- Função para incrementar watch_time
-- CREATE OR REPLACE FUNCTION increment_video_watch_time(video_id UUID, seconds NUMERIC)
-- RETURNS NUMERIC
-- LANGUAGE plpgsql
-- SECURITY DEFINER
-- AS $$
-- DECLARE
--     new_watch_time NUMERIC;
-- BEGIN
--     UPDATE videos
--     SET watch_time = COALESCE(watch_time, 0) + seconds
--     WHERE id = video_id
--     RETURNING watch_time INTO new_watch_time;
--     
--     RETURN COALESCE(new_watch_time, 0);
-- END;
-- $$;

-- GRANT EXECUTE ON FUNCTION increment_video_views(UUID) TO authenticated;
-- GRANT EXECUTE ON FUNCTION increment_video_watch_time(UUID, NUMERIC) TO authenticated;


