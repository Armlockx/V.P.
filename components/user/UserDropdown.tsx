'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/types/user';

interface UserDropdownProps {
  isAdmin?: boolean;
  controlsVisible?: boolean;
}

export function UserDropdown({ isAdmin = false, controlsVisible = true }: UserDropdownProps) {
  const auth = useAuth();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    const loadProfile = async () => {
      if (!auth.user) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', auth.user.id)
          .single();

        if (error) throw error;
        if (data) {
          setProfile(data);
        }
      } catch (error) {
        console.error('Erro ao carregar perfil:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [auth.user, supabase]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleUserClick = () => {
    setIsOpen(false);
    if (isAdmin) {
      router.push('/admin');
    } else {
      router.push('/profile');
    }
  };

  const handleLogout = async () => {
    setIsOpen(false);
    await auth.signOut();
  };

  if (!auth.isAuthenticated || auth.isGuest || loading) {
    return null;
  }

  const avatarUrl = profile?.avatar_url;
  const username = profile?.username || auth.user?.email?.split('@')[0] || 'Usuário';
  const initial = username.charAt(0).toUpperCase();

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          width: '45px',
          height: '45px',
          background: 'rgba(255, 255, 255, 0.08)',
          border: '2px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '50%',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          opacity: controlsVisible ? (isOpen ? 1 : 0.7) : 0,
          transition: 'opacity 0.3s ease, border-color 0.3s ease',
          overflow: 'hidden',
          padding: 0,
          pointerEvents: controlsVisible ? 'auto' : 'none',
        }}
        onMouseEnter={(e) => {
          if (controlsVisible) {
            e.currentTarget.style.opacity = '1';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
          }
        }}
        onMouseLeave={(e) => {
          if (controlsVisible && !isOpen) {
            e.currentTarget.style.opacity = '0.7';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
          }
        }}
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={username}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              fontSize: '18px',
              fontWeight: 600,
            }}
          >
            {initial}
          </div>
        )}
      </button>

      {isOpen && (
        <div
          style={{
            position: 'fixed',
            top: '75px',
            right: '20px',
            background: 'rgba(26, 26, 26, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '8px',
            minWidth: '200px',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
            zIndex: 10000,
          }}
          className="user-dropdown-menu"
        >
          <div
            style={{
              padding: '12px 16px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              marginBottom: '4px',
            }}
          >
            <div
              style={{
                fontSize: '13px',
                color: 'rgba(255, 255, 255, 0.6)',
                marginBottom: '4px',
              }}
            >
              {username}
            </div>
            <div
              style={{
                fontSize: '11px',
                color: 'rgba(255, 255, 255, 0.4)',
              }}
            >
              {auth.user?.email}
            </div>
          </div>

          <button
            onClick={handleUserClick}
            style={{
              width: '100%',
              padding: '12px 16px',
              background: 'transparent',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
              gap: '12px',
              transition: 'background 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <span style={{ fontSize: '18px' }}>{isAdmin ? '👑' : '👤'}</span>
            <span>{isAdmin ? 'Painel Admin' : 'Meu Perfil'}</span>
          </button>

          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              padding: '12px 16px',
              background: 'transparent',
              border: 'none',
              borderRadius: '8px',
              color: '#ff6b6b',
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
              gap: '12px',
              transition: 'background 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 68, 68, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <span style={{ fontSize: '18px' }}>🚪</span>
            <span>Sair</span>
          </button>
        </div>
      )}

    </div>
  );
}

