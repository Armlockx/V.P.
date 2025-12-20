-- Script para configurar perfis de usuários e avatares
-- Execute este script no SQL Editor do Supabase

-- ============================================
-- PARTE 1: Criar tabela de perfis
-- ============================================

-- Criar tabela de perfis se não existir
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT NOT NULL UNIQUE,
    avatar_url TEXT,
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índice para busca rápida por username
CREATE INDEX IF NOT EXISTS profiles_username_idx ON profiles(username);

-- ============================================
-- PARTE 2: Políticas RLS para perfis
-- ============================================

-- Habilitar RLS na tabela profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Todos podem ler perfis" ON profiles;
DROP POLICY IF EXISTS "Usuários podem atualizar seu próprio perfil" ON profiles;

-- Permitir que todos leiam perfis (necessário para mostrar avatares e usernames nos comentários)
CREATE POLICY "Todos podem ler perfis"
ON profiles
FOR SELECT
TO public
USING (true);

-- Permitir que usuários atualizem seu próprio perfil
CREATE POLICY "Usuários podem atualizar seu próprio perfil"
ON profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Permitir que usuários insiram seu próprio perfil
CREATE POLICY "Usuários podem inserir seu próprio perfil"
ON profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- ============================================
-- PARTE 3: Adicionar coluna user_id na tabela videos (se não existir)
-- ============================================

-- Adicionar coluna user_id na tabela videos se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'videos' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE videos ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
        CREATE INDEX IF NOT EXISTS videos_user_id_idx ON videos(user_id);
    END IF;
END $$;

-- ============================================
-- PARTE 4: Políticas de Storage para avatares
-- ============================================
-- Nota: Os avatares serão armazenados na pasta "Avatars" do bucket "v-p-player"
-- O bucket "v-p-player" já existe e é público

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Todos podem ler avatares" ON storage.objects;
DROP POLICY IF EXISTS "Usuários podem fazer upload de seus avatares" ON storage.objects;
DROP POLICY IF EXISTS "Usuários podem atualizar seus avatares" ON storage.objects;
DROP POLICY IF EXISTS "Usuários podem deletar seus avatares" ON storage.objects;

-- Permitir que todos leiam avatares (na pasta Avatars do bucket v-p-player)
CREATE POLICY "Todos podem ler avatares"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'v-p-player' AND (storage.foldername(name))[1] = 'Avatars');

-- Permitir que usuários autenticados façam upload de seus próprios avatares
CREATE POLICY "Usuários podem fazer upload de seus avatares"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'v-p-player' AND (storage.foldername(name))[1] = 'Avatars');

-- Permitir que usuários autenticados atualizem seus próprios avatares
CREATE POLICY "Usuários podem atualizar seus avatares"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'v-p-player' AND (storage.foldername(name))[1] = 'Avatars');

-- Permitir que usuários autenticados deletem seus próprios avatares
CREATE POLICY "Usuários podem deletar seus avatares"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'v-p-player' AND (storage.foldername(name))[1] = 'Avatars');

