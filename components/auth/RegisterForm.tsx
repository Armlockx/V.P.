'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';

interface RegisterFormProps {
  onClose: () => void;
}

export function RegisterForm({ onClose }: RegisterFormProps) {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [avatar, setAvatar] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp, signInAsGuest } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    if (password.length < 8) {
      setError('A senha deve ter no mínimo 8 caracteres');
      return;
    }

    if (username.length < 3) {
      setError('O nome de usuário deve ter no mínimo 3 caracteres');
      return;
    }

    setLoading(true);

    try {
      await signUp(email, password, username, avatar || undefined);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao criar conta');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = () => {
    signInAsGuest();
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <div>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{
            width: '100%',
            padding: '14px 16px',
            background: 'rgba(255, 255, 255, 0.12)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '8px',
            color: 'white',
            fontSize: '15px',
            outline: 'none',
          }}
        />
      </div>

      <div>
        <input
          type="text"
          placeholder="Nome de usuário"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          minLength={3}
          maxLength={30}
          style={{
            width: '100%',
            padding: '14px 16px',
            background: 'rgba(255, 255, 255, 0.12)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '8px',
            color: 'white',
            fontSize: '15px',
            outline: 'none',
          }}
        />
      </div>

      <div>
        <input
          type="password"
          placeholder="Senha (mín. 8 caracteres)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          style={{
            width: '100%',
            padding: '14px 16px',
            background: 'rgba(255, 255, 255, 0.12)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '8px',
            color: 'white',
            fontSize: '15px',
            outline: 'none',
          }}
        />
      </div>

      <div>
        <input
          type="password"
          placeholder="Confirmar Senha"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength={8}
          style={{
            width: '100%',
            padding: '14px 16px',
            background: 'rgba(255, 255, 255, 0.12)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '8px',
            color: 'white',
            fontSize: '15px',
            outline: 'none',
          }}
        />
      </div>

      <div>
        <label
          style={{
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: '14px',
            marginBottom: '8px',
            display: 'block',
          }}
        >
          Imagem de perfil (opcional)
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setAvatar(e.target.files?.[0] || null)}
          style={{
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: '14px',
          }}
        />
      </div>

      {error && (
        <div
          style={{
            padding: '10px 14px',
            background: 'rgba(255, 68, 68, 0.2)',
            border: '1px solid rgba(255, 68, 68, 0.4)',
            borderRadius: '6px',
            color: '#ff6b6b',
            fontSize: '13px',
            textAlign: 'center',
          }}
        >
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        style={{
          padding: '14px 24px',
          background: 'red',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '16px',
          fontWeight: 600,
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.6 : 1,
        }}
      >
        {loading ? 'Registrando...' : 'Registrar'}
      </button>

      <button
        type="button"
        onClick={handleGuestLogin}
        style={{
          padding: '10px 20px',
          background: 'transparent',
          color: 'rgba(255, 255, 255, 0.5)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: 500,
          cursor: 'pointer',
        }}
      >
        Entrar como convidado
      </button>
    </form>
  );
}


