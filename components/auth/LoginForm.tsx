'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';

interface LoginFormProps {
  onClose: () => void;
}

export function LoginForm({ onClose }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signInAsGuest } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(email, password);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer login');
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
          type="password"
          placeholder="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
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
        {loading ? 'Entrando...' : 'Entrar'}
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


