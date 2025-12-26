-- Script para testar criação de perfil manualmente
-- Execute este script no SQL Editor do Supabase

-- ============================================
-- PARTE 1: Verificar políticas de INSERT
-- ============================================

-- Verificar políticas de INSERT existentes
SELECT policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE tablename = 'profiles' AND cmd = 'INSERT';

-- ============================================
-- PARTE 2: Testar criação de perfil manual
-- ============================================

-- IMPORTANTE: Substitua 'USER_ID_AQUI' pelo ID de um usuário real do auth.users
-- Para obter um ID, execute: SELECT id, email FROM auth.users LIMIT 1;

-- Testar INSERT manual (substitua o ID)
/*
INSERT INTO profiles (id, username, avatar_url, email)
VALUES (
    'USER_ID_AQUI'::uuid,
    'teste_usuario',
    'https://example.com/avatar.jpg',
    'teste@example.com'
)
RETURNING *;
*/

-- ============================================
-- PARTE 3: Verificar se há trigger ou função que bloqueia INSERT
-- ============================================

-- Verificar triggers na tabela profiles
SELECT trigger_name, event_manipulation, event_object_table, action_statement
FROM information_schema.triggers
WHERE event_object_table = 'profiles';

-- ============================================
-- PARTE 4: Garantir que a política de INSERT está correta
-- ============================================

-- Remover política de INSERT antiga se existir
DROP POLICY IF EXISTS "Usuários podem inserir seu próprio perfil" ON profiles;

-- Criar política de INSERT que permite usuários autenticados criarem seu próprio perfil
CREATE POLICY "Usuários podem inserir seu próprio perfil"
ON profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Verificar se a política foi criada
SELECT policyname, cmd, roles
FROM pg_policies
WHERE tablename = 'profiles' AND cmd = 'INSERT';


