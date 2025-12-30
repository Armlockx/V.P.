'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { VideoManager } from './VideoManager';
import { UserManager } from './UserManager';
import { StatsPanel } from './StatsPanel';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/types/user';

export function AdminDashboard() {
  const auth = useAuth();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Permitir scroll na página admin
  useEffect(() => {
    document.body.classList.add('admin-page');
    return () => {
      document.body.classList.remove('admin-page');
    };
  }, []);

  useEffect(() => {
    const checkAdminAccess = async () => {
      if (auth.loading) return;

      if (!auth.user) {
        router.push('/');
        return;
      }

      try {
        const adminStatus = await auth.checkAdmin();
        setIsAdmin(adminStatus);

        if (!adminStatus) {
          router.push('/');
          return;
        }

        // Carregar perfil do usuário
        const supabase = createClient();
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', auth.user.id)
          .single();

        if (profile) {
          setUserProfile(profile);
        }
      } catch (error) {
        console.error('Erro ao verificar admin:', error);
        router.push('/');
      } finally {
        setLoading(false);
      }
    };

    checkAdminAccess();
  }, [auth, router]);

  if (loading || isAdmin === null) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '80vh',
          gap: '20px',
        }}
      >
        <div
          style={{
            width: '50px',
            height: '50px',
            border: '4px solid rgba(255, 255, 255, 0.1)',
            borderTopColor: '#ffffff',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }}
        />
        <p style={{ color: 'white' }}>Verificando permissões...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '80vh',
        }}
      >
        <div
          style={{
            textAlign: 'center',
            padding: '40px',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            maxWidth: '500px',
          }}
        >
          <h2 style={{ margin: '0 0 20px 0', fontSize: '32px' }}>⛔ Acesso Negado</h2>
          <p style={{ margin: '0 0 30px 0', color: 'rgba(255, 255, 255, 0.7)', fontSize: '16px' }}>
            Você não tem permissão para acessar o painel de administração.
          </p>
          <button
            onClick={() => router.push('/')}
            style={{
              padding: '10px 20px',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Voltar ao Player
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0a0a0a',
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      {/* Header */}
      <header
        style={{
          background: 'rgba(255, 255, 255, 0.05)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '20px 30px',
          backdropFilter: 'blur(10px)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            maxWidth: '1400px',
            margin: '0 auto',
          }}
        >
          <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 600, color: '#ffffff' }}>
            Painel de Administração
          </h1>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => router.push('/')}
              style={{
                padding: '10px 20px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Voltar ao Player
            </button>
            <button
              onClick={() => auth.signOut()}
              style={{
                padding: '10px 20px',
                background: 'rgba(255, 68, 68, 0.2)',
                border: '1px solid rgba(255, 68, 68, 0.4)',
                borderRadius: '8px',
                color: '#ff6b6b',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      {/* Dashboard Content */}
      <div
        style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '30px',
        }}
      >
        {/* User Info */}
        {userProfile && (
          <section
            style={{
              marginBottom: '40px',
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '12px',
              padding: '30px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <h2
              style={{
                margin: '0 0 20px 0',
                fontSize: '24px',
                fontWeight: 600,
                color: '#ffffff',
                paddingBottom: '15px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              Informações do Usuário
            </h2>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '20px',
                padding: '20px',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              {userProfile.avatar_url ? (
                <img
                  src={userProfile.avatar_url}
                  alt={userProfile.username}
                  style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                  }}
                />
              ) : (
                <div
                  style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '32px',
                    fontWeight: 'bold',
                    color: '#ffffff',
                  }}
                >
                  {userProfile.username?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: 600 }}>
                  {userProfile.username || 'Usuário'}
                </h3>
                <p style={{ margin: '0 0 12px 0', color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px' }}>
                  {userProfile.email}
                </p>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    fontSize: '14px',
                    fontWeight: 500,
                    background: 'rgba(255, 215, 0, 0.2)',
                    color: '#ffd700',
                    border: '1px solid rgba(255, 215, 0, 0.4)',
                  }}
                >
                  👑 Administrador
                </span>
              </div>
            </div>
          </section>
        )}

        {/* Statistics */}
        <StatsPanel />

        {/* Video Management */}
        <VideoManager />

        {/* User Management */}
        <UserManager />
      </div>
    </div>
  );
}


