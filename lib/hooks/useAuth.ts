'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    // Verificar sessão inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Escutar mudanças de autenticação
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  }, [supabase]);

  const signUp = useCallback(async (
    email: string,
    password: string,
    username: string,
    avatar?: File
  ) => {
    // Criar usuário
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
        },
      },
    });

    if (authError) throw authError;

    // Upload de avatar se fornecido
    if (avatar && authData.user) {
      const fileExt = avatar.name.split('.').pop();
      const fileName = `${authData.user.id}-${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, avatar);

      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);

        // Atualizar perfil
        await supabase
          .from('profiles')
          .update({ avatar_url: publicUrl })
          .eq('id', authData.user.id);
      }
    }

    // Criar perfil
    if (authData.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          username,
          email,
          avatar_url: null,
          is_admin: false,
        });

      if (profileError && profileError.code !== '23505') {
        // Ignorar erro se perfil já existe
        console.error('Erro ao criar perfil:', profileError);
      }
    }

    return authData;
  }, [supabase]);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
    setIsGuest(false);
  }, [supabase]);

  const signInAsGuest = useCallback(() => {
    setIsGuest(true);
    setUser(null);
  }, []);

  const checkAdmin = useCallback(async (): Promise<boolean> => {
    if (!user) return false;

    try {
      // Buscar direto da tabela profiles (mais confiável)
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Erro ao verificar admin:', error);
        return false;
      }

      return profile?.is_admin === true;
    } catch (error) {
      console.error('Erro ao verificar admin:', error);
      return false;
    }
  }, [supabase, user]);

  return {
    user,
    loading,
    isGuest,
    signIn,
    signUp,
    signOut,
    signInAsGuest,
    checkAdmin,
    isAuthenticated: !!user || isGuest,
  };
}


