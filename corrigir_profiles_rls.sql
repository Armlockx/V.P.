-- Script para corrigir políticas RLS da tabela profiles
-- Execute este script no SQL Editor do Supabase

-- ============================================
-- PARTE 1: Verificar estado atual
-- ============================================

-- Verificar se RLS está habilitado
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'profiles';

-- Verificar políticas existentes
SELECT policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE tablename = 'profiles';

-- Verificar se há dados na tabela
SELECT COUNT(*) AS total_profiles FROM profiles;

-- Listar todos os perfis
SELECT id, username, avatar_url, email, created_at
FROM profiles
ORDER BY created_at DESC
LIMIT 10;

-- ============================================
-- PARTE 2: Corrigir políticas RLS
-- ============================================

-- Remover TODAS as políticas antigas
DROP POLICY IF EXISTS "Todos podem ler perfis" ON profiles;
DROP POLICY IF EXISTS "Usuários podem atualizar seu próprio perfil" ON profiles;
DROP POLICY IF EXISTS "Usuários podem inserir seu próprio perfil" ON profiles;
DROP POLICY IF EXISTS "Public can read profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Garantir que RLS está habilitado
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Criar política que permite SELECT para TODOS (public, anon, authenticated)
CREATE POLICY "Todos podem ler perfis"
ON profiles
FOR SELECT
TO public
USING (true);

-- Criar política específica para anon (fallback)
CREATE POLICY "Anônimos podem ler perfis"
ON profiles
FOR SELECT
TO anon
USING (true);

-- Criar política específica para authenticated (fallback)
CREATE POLICY "Autenticados podem ler perfis"
ON profiles
FOR SELECT
TO authenticated
USING (true);

-- Permitir que usuários atualizem seu próprio perfil
CREATE POLICY "Usuários podem atualizar seu próprio perfil"
ON profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Permitir que usuários insiram seu próprio perfil
-- IMPORTANTE: Remover política antiga primeiro
DROP POLICY IF EXISTS "Usuários podem inserir seu próprio perfil" ON profiles;

CREATE POLICY "Usuários podem inserir seu próprio perfil"
ON profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Verificar se a política foi criada
SELECT policyname, cmd, roles, with_check
FROM pg_policies
WHERE tablename = 'profiles' AND cmd = 'INSERT';

-- ============================================
-- PARTE 3: Verificar novamente
-- ============================================

-- Verificar políticas criadas
SELECT policyname, cmd, roles
FROM pg_policies
WHERE tablename = 'profiles';

-- Testar se consegue ler perfis como anon
-- (Execute esta query como anon para testar)
SELECT id, username, avatar_url
FROM profiles
LIMIT 5;

