-- Script para configurar sistema de administração
-- Execute este script no SQL Editor do Supabase

-- ============================================
-- PARTE 1: Remover coluna admin e usar is_admin
-- ============================================

-- Remover coluna admin se existir (já existe is_admin)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'admin'
    ) THEN
        ALTER TABLE profiles DROP COLUMN admin;
    END IF;
END $$;

-- Garantir que is_admin existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'is_admin'
    ) THEN
        ALTER TABLE profiles ADD COLUMN is_admin BOOLEAN DEFAULT FALSE NOT NULL;
        CREATE INDEX IF NOT EXISTS profiles_is_admin_idx ON profiles(is_admin);
    END IF;
END $$;

-- ============================================
-- PARTE 2: Criar função RPC para verificar se usuário é admin
-- ============================================

CREATE OR REPLACE FUNCTION check_user_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    admin_status BOOLEAN;
BEGIN
    -- Verificar se usuário está autenticado
    IF auth.uid() IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Buscar status admin do perfil (qualificar coluna com nome da tabela para evitar ambiguidade)
    SELECT COALESCE(profiles.is_admin, FALSE) INTO admin_status
    FROM profiles
    WHERE profiles.id = auth.uid();
    
    RETURN COALESCE(admin_status, FALSE);
END;
$$;

-- Dar permissão para executar a função
GRANT EXECUTE ON FUNCTION check_user_admin() TO authenticated, anon, public;

-- ============================================
-- PARTE 3: Criar função RPC para obter perfil com informação de admin
-- ============================================

CREATE OR REPLACE FUNCTION get_user_profile()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    profile_data JSON;
BEGIN
    -- Verificar se usuário está autenticado
    IF auth.uid() IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Buscar perfil do usuário
    SELECT json_build_object(
        'id', id,
        'username', username,
        'avatar_url', avatar_url,
        'email', email,
        'is_admin', COALESCE(is_admin, FALSE),
        'admin', COALESCE(is_admin, FALSE), -- Manter compatibilidade
        'created_at', created_at,
        'updated_at', updated_at
    ) INTO profile_data
    FROM profiles
    WHERE id = auth.uid();
    
    RETURN profile_data;
END;
$$;

-- Dar permissão para executar a função
GRANT EXECUTE ON FUNCTION get_user_profile() TO authenticated, anon, public;

-- ============================================
-- PARTE 4: Atualizar função create_user_profile para incluir is_admin
-- ============================================

-- A função create_user_profile já existe, mas vamos garantir que o campo is_admin seja inicializado como FALSE
-- (já está sendo feito pelo DEFAULT na coluna)

-- ============================================
-- PARTE 5: Criar políticas RLS para permitir que admins atualizem status admin
-- ============================================

-- Nota: Atualizações de status admin devem ser feitas manualmente no Supabase Dashboard
-- ou através de uma função RPC adicional com segurança apropriada
-- Por enquanto, não criaremos política RLS para permitir UPDATE de admin via cliente
-- O campo admin deve ser alterado apenas por administradores do banco de dados

-- ============================================
-- VERIFICAÇÕES
-- ============================================

-- Verificar se a coluna is_admin existe
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'profiles' AND column_name = 'is_admin';

-- Verificar se a coluna admin foi removida
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'profiles' AND column_name = 'admin';

-- Verificar funções criadas
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public' 
  AND routine_name IN ('check_user_admin', 'get_user_profile')
ORDER BY routine_name;

-- Exemplo: Definir um usuário como admin (substitua 'USER_ID_AQUI' pelo ID do usuário)
-- UPDATE profiles SET is_admin = TRUE WHERE id = 'USER_ID_AQUI'::UUID;

