-- Script para corrigir o erro de ambiguidade na função check_user_admin
-- Execute este script no SQL Editor do Supabase

-- Corrigir função check_user_admin removendo ambiguidade
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

-- Verificar se a função foi criada corretamente
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public' 
  AND routine_name = 'check_user_admin';

