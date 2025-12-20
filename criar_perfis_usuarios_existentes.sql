-- Script para criar perfis para usuários existentes que não têm perfil
-- Execute este script no SQL Editor do Supabase

-- ============================================
-- PARTE 1: Verificar usuários sem perfil
-- ============================================

-- Listar usuários que têm comentários mas não têm perfil
SELECT DISTINCT vc.user_id, au.email, MAX(vc.created_at) as ultimo_comentario
FROM video_comments vc
LEFT JOIN profiles p ON p.id = vc.user_id
LEFT JOIN auth.users au ON au.id = vc.user_id
WHERE p.id IS NULL
GROUP BY vc.user_id, au.email
ORDER BY ultimo_comentario DESC;

-- Listar usuários que têm likes mas não têm perfil
SELECT DISTINCT vl.user_id, au.email, MAX(vl.created_at) as ultimo_like
FROM video_likes vl
LEFT JOIN profiles p ON p.id = vl.user_id
LEFT JOIN auth.users au ON au.id = vl.user_id
WHERE p.id IS NULL
GROUP BY vl.user_id, au.email
ORDER BY ultimo_like DESC;

-- Listar todos os usuários do auth.users que não têm perfil
SELECT au.id, au.email, au.created_at
FROM auth.users au
LEFT JOIN profiles p ON p.id = au.id
WHERE p.id IS NULL
ORDER BY au.created_at DESC;

-- ============================================
-- PARTE 2: Criar perfis para usuários existentes
-- ============================================

-- IMPORTANTE: Este script cria perfis com username baseado no email
-- Você pode modificar para usar um nome diferente

-- Criar perfis para usuários que comentaram mas não têm perfil
INSERT INTO profiles (id, username, email, avatar_url)
SELECT DISTINCT 
    vc.user_id,
    COALESCE(
        SPLIT_PART(au.email, '@', 1),  -- Usar parte antes do @ como username
        'usuario_' || SUBSTRING(vc.user_id::text, 1, 8)  -- Fallback: usuario_ + primeiros 8 caracteres do ID
    ) AS username,
    au.email,
    NULL AS avatar_url
FROM video_comments vc
LEFT JOIN profiles p ON p.id = vc.user_id
LEFT JOIN auth.users au ON au.id = vc.user_id
WHERE p.id IS NULL AND au.id IS NOT NULL
ON CONFLICT (id) DO NOTHING;

-- Criar perfis para usuários que deram like mas não têm perfil
INSERT INTO profiles (id, username, email, avatar_url)
SELECT DISTINCT 
    vl.user_id,
    COALESCE(
        SPLIT_PART(au.email, '@', 1),  -- Usar parte antes do @ como username
        'usuario_' || SUBSTRING(vl.user_id::text, 1, 8)  -- Fallback: usuario_ + primeiros 8 caracteres do ID
    ) AS username,
    au.email,
    NULL AS avatar_url
FROM video_likes vl
LEFT JOIN profiles p ON p.id = vl.user_id
LEFT JOIN auth.users au ON au.id = vl.user_id
WHERE p.id IS NULL AND au.id IS NOT NULL
ON CONFLICT (id) DO NOTHING;

-- Criar perfis para todos os usuários do auth.users que não têm perfil
INSERT INTO profiles (id, username, email, avatar_url)
SELECT 
    au.id,
    COALESCE(
        SPLIT_PART(au.email, '@', 1),  -- Usar parte antes do @ como username
        'usuario_' || SUBSTRING(au.id::text, 1, 8)  -- Fallback: usuario_ + primeiros 8 caracteres do ID
    ) AS username,
    au.email,
    NULL AS avatar_url
FROM auth.users au
LEFT JOIN profiles p ON p.id = au.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- PARTE 3: Verificar resultado
-- ============================================

-- Verificar quantos perfis foram criados
SELECT COUNT(*) AS total_profiles FROM profiles;

-- Listar todos os perfis
SELECT id, username, email, avatar_url, created_at
FROM profiles
ORDER BY created_at DESC;

