'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/types/user';

export default function ProfilePage() {
  const auth = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (!auth.loading && !auth.isAuthenticated) {
      router.push('/');
      return;
    }

    if (auth.user) {
      loadProfile();
    }
  }, [auth, router]);

  const loadProfile = async () => {
    if (!auth.user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', auth.user.id)
        .single();

      if (error) throw error;
      if (data) {
        setProfile(data);
        setUsername(data.username);
        setEmail(data.email);
        setAvatarPreview(data.avatar_url);
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!auth.user) return;

    setSaving(true);
    try {
      let avatarUrl = profile?.avatar_url || null;

      // Upload de novo avatar se fornecido
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${auth.user.id}-${Date.now()}.${fileExt}`;
        const filePath = `avatars/${fileName}`;

        // Deletar avatar antigo se existir
        if (profile?.avatar_url) {
          const oldPath = profile.avatar_url.split('/').pop();
          if (oldPath) {
            await supabase.storage.from('avatars').remove([oldPath]);
          }
        }

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, avatarFile);

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(filePath);
          avatarUrl = publicUrl;
        }
      }

      // Atualizar perfil
      const { error } = await supabase
        .from('profiles')
        .update({
          username: username.trim(),
          email: email.trim(),
          avatar_url: avatarUrl,
        })
        .eq('id', auth.user.id);

      if (error) throw error;

      // Atualizar email no auth se mudou
      if (email.trim() !== auth.user.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: email.trim(),
        });
        if (emailError) {
          console.error('Erro ao atualizar email:', emailError);
        }
      }

      await loadProfile();
      setEditing(false);
      alert('Perfil atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar perfil:', error);
      alert('Erro ao salvar perfil');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          background: '#0a0a0a',
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
      </div>
    );
  }

  if (!profile) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          background: '#0a0a0a',
          color: 'white',
        }}
      >
        <p>Erro ao carregar perfil</p>
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
        padding: '40px 20px',
      }}
    >
      <div
        style={{
          maxWidth: '800px',
          margin: '0 auto',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '40px',
          }}
        >
          <h1 style={{ margin: 0, fontSize: '32px', fontWeight: 600 }}>Meu Perfil</h1>
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

        <div
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '12px',
            padding: '40px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              marginBottom: '40px',
            }}
          >
            <div
              style={{
                position: 'relative',
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                overflow: 'hidden',
                marginBottom: '20px',
                border: '3px solid rgba(255, 255, 255, 0.2)',
              }}
            >
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt={username}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
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
                    fontSize: '48px',
                    fontWeight: 600,
                  }}
                >
                  {username.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {editing && (
              <label
                style={{
                  padding: '10px 20px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '14px',
                  cursor: 'pointer',
                  marginBottom: '20px',
                }}
              >
                Alterar Foto
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  style={{ display: 'none' }}
                />
              </label>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
              <label
                style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontWeight: 500,
                }}
              >
                Nome de Usuário
              </label>
              {editing ? (
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                  }}
                />
              ) : (
                <div
                  style={{
                    padding: '12px 16px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '14px',
                  }}
                >
                  {username}
                </div>
              )}
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontWeight: 500,
                }}
              >
                Email
              </label>
              {editing ? (
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                  }}
                />
              ) : (
                <div
                  style={{
                    padding: '12px 16px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '14px',
                  }}
                >
                  {email}
                </div>
              )}
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontWeight: 500,
                }}
              >
                Membro desde
              </label>
              <div
                style={{
                  padding: '12px 16px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '8px',
                  color: 'rgba(255, 255, 255, 0.6)',
                  fontSize: '14px',
                }}
              >
                {new Date(profile.created_at).toLocaleDateString('pt-BR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </div>
            </div>

            {profile.is_admin && (
              <div
                style={{
                  padding: '12px 16px',
                  background: 'rgba(255, 215, 0, 0.1)',
                  border: '1px solid rgba(255, 215, 0, 0.3)',
                  borderRadius: '8px',
                  color: '#ffd700',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span>👑</span>
                <span>Administrador</span>
              </div>
            )}
          </div>

          <div
            style={{
              display: 'flex',
              gap: '12px',
              marginTop: '40px',
              justifyContent: 'flex-end',
            }}
          >
            {editing ? (
              <>
                <button
                  onClick={() => {
                    setEditing(false);
                    setUsername(profile.username);
                    setEmail(profile.email);
                    setAvatarFile(null);
                    setAvatarPreview(profile.avatar_url);
                  }}
                  disabled={saving}
                  style={{
                    padding: '12px 24px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: saving ? 'not-allowed' : 'pointer',
                    opacity: saving ? 0.5 : 1,
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  style={{
                    padding: '12px 24px',
                    background: saving ? 'rgba(255, 255, 255, 0.2)' : 'linear-gradient(135deg, #667eea, #764ba2)',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: saving ? 'not-allowed' : 'pointer',
                    opacity: saving ? 0.5 : 1,
                  }}
                >
                  {saving ? 'Salvando...' : 'Salvar'}
                </button>
              </>
            ) : (
              <button
                onClick={() => setEditing(true)}
                style={{
                  padding: '12px 24px',
                  background: 'linear-gradient(135deg, #667eea, #764ba2)',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Editar Perfil
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

