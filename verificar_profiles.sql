-- Script para verificar se a tabela profiles existe e tem dados
-- Execute este script no SQL Editor do Supabase

-- Verificar se a tabela profiles existe
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles'
) AS tabela_existe;

-- Verificar estrutura da tabela profiles
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- Verificar se há dados na tabela profiles
SELECT COUNT(*) AS total_profiles FROM profiles;

-- Listar todos os perfis (primeiros 10)
SELECT id, username, avatar_url, email, created_at
FROM profiles
ORDER BY created_at DESC
LIMIT 10;

-- Verificar políticas RLS na tabela profiles
SELECT policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE tablename = 'profiles';

-- Verificar se RLS está habilitado
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'profiles';


