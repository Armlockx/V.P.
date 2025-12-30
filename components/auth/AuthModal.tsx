'use client';

import { useState } from 'react';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  if (!isOpen) return null;

  return (
    <div
      className="auth-modal"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(20px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="auth-modal-content"
        style={{
          background: 'rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(40px)',
          border: '1px solid rgba(255, 255, 255, 0.18)',
          borderRadius: '16px',
          padding: '40px',
          width: '100%',
          maxWidth: '420px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
          position: 'relative',
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '15px',
            right: '15px',
            background: 'rgba(255, 255, 255, 0.1)',
            border: 'none',
            color: 'white',
            fontSize: '28px',
            cursor: 'pointer',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          ×
        </button>

        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h2 style={{ color: 'white', fontSize: '28px', fontWeight: 700, margin: '0 0 8px 0' }}>
            V.P. Player
          </h2>
          <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px', margin: 0 }}>
            Entre para acessar seus vídeos
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            gap: '10px',
            marginBottom: '25px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <button
            onClick={() => setActiveTab('login')}
            style={{
              flex: 1,
              padding: '12px 20px',
              background: 'transparent',
              border: 'none',
              color: activeTab === 'login' ? 'white' : 'rgba(255, 255, 255, 0.6)',
              fontSize: '15px',
              fontWeight: 600,
              cursor: 'pointer',
              borderBottom: `2px solid ${activeTab === 'login' ? 'red' : 'transparent'}`,
              marginBottom: '-1px',
            }}
          >
            Entrar
          </button>
          <button
            onClick={() => setActiveTab('register')}
            style={{
              flex: 1,
              padding: '12px 20px',
              background: 'transparent',
              border: 'none',
              color: activeTab === 'register' ? 'white' : 'rgba(255, 255, 255, 0.6)',
              fontSize: '15px',
              fontWeight: 600,
              cursor: 'pointer',
              borderBottom: `2px solid ${activeTab === 'register' ? 'red' : 'transparent'}`,
              marginBottom: '-1px',
            }}
          >
            Registrar
          </button>
        </div>

        {activeTab === 'login' ? (
          <LoginForm onClose={onClose} />
        ) : (
          <RegisterForm onClose={onClose} />
        )}
      </div>
    </div>
  );
}


