-- Script para criar função RPC que bypassa RLS para criar perfis
-- Execute este script no SQL Editor do Supabase

-- ============================================
-- PARTE 1: Criar função RPC para criar perfil
-- ============================================

-- Remover função antiga se existir
DROP FUNCTION IF EXISTS create_user_profile(UUID, TEXT, TEXT, TEXT);

-- Função para criar perfil (bypass RLS)
-- IMPORTANTE: Valida que o user_id corresponde ao usuário autenticado
CREATE OR REPLACE FUNCTION create_user_profile(
    user_id UUID,
    user_username TEXT,
    user_avatar_url TEXT,
    user_email TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    profile_data JSON;
    current_user_id UUID;
BEGIN
    -- Obter ID do usuário autenticado
    current_user_id := auth.uid();
    
    -- Validar que o user_id corresponde ao usuário autenticado
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuário não autenticado';
    END IF;
    
    IF user_id != current_user_id THEN
        RAISE EXCEPTION 'Não autorizado: você só pode criar/atualizar seu próprio perfil';
    END IF;
    
    -- Validar que username não está vazio e tem tamanho adequado
    IF user_username IS NULL OR LENGTH(TRIM(user_username)) < 3 THEN
        RAISE EXCEPTION 'Username deve ter pelo menos 3 caracteres';
    END IF;
    
    IF LENGTH(TRIM(user_username)) > 30 THEN
        RAISE EXCEPTION 'Username deve ter no máximo 30 caracteres';
    END IF;
    
    -- Inserir ou atualizar perfil
    INSERT INTO profiles (id, username, avatar_url, email)
    VALUES (user_id, TRIM(user_username), user_avatar_url, user_email)
    ON CONFLICT (id) DO UPDATE
    SET 
        username = EXCLUDED.username,
        avatar_url = EXCLUDED.avatar_url,
        email = EXCLUDED.email,
        updated_at = NOW()
    RETURNING json_build_object(
        'id', id,
        'username', username,
        'avatar_url', avatar_url,
        'email', email
    ) INTO profile_data;
    
    RETURN profile_data;
END;
$$;

-- Permitir que todos executem essa função (mas ela só funciona se chamada com o user_id correto)
GRANT EXECUTE ON FUNCTION create_user_profile(UUID, TEXT, TEXT, TEXT) TO authenticated, anon, public;

-- ============================================
-- PARTE 2: Garantir que políticas RLS estão corretas
-- ============================================

-- Remover política de INSERT antiga se existir
DROP POLICY IF EXISTS "Usuários podem inserir seu próprio perfil" ON profiles;

-- Criar política de INSERT (fallback caso RPC não funcione)
CREATE POLICY "Usuários podem inserir seu próprio perfil"
ON profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Verificar políticas
SELECT policyname, cmd, roles
FROM pg_policies
WHERE tablename = 'profiles';

