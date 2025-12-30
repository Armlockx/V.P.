'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/types/user';

export function UserManager() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      let query = supabase.from('profiles').select('*').order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.or(`username.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      if (data) {
        setUsers(data);
      }
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    } finally {
      setLoading(false);
    }
  };

  const normalUsers = users.filter((user) => !user.is_admin);
  const adminUsers = users.filter((user) => user.is_admin);

  return (
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
        Gerenciamento de Usuários
      </h2>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Buscar usuários..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') loadUsers();
          }}
          style={{
            flex: 1,
            minWidth: '200px',
            padding: '10px 15px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '8px',
            color: '#ffffff',
            fontSize: '14px',
          }}
        />
        <button
          onClick={loadUsers}
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
          Atualizar Lista
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div>
          <h3
            style={{
              margin: '0 0 16px 0',
              fontSize: '18px',
              fontWeight: 600,
              color: '#ffffff',
              paddingBottom: '12px',
              borderBottom: '2px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            👤 Usuários
          </h3>
          {loading ? (
            <p style={{ color: 'rgba(255, 255, 255, 0.6)', textAlign: 'center', padding: '40px' }}>
              Carregando...
            </p>
          ) : normalUsers.length === 0 ? (
            <p style={{ color: 'rgba(255, 255, 255, 0.6)', textAlign: 'center', padding: '40px' }}>
              Nenhum usuário encontrado
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '600px', overflowY: 'auto' }}>
              {normalUsers.map((user) => (
                <div
                  key={user.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '15px',
                    padding: '15px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                >
                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.username}
                      style={{
                        width: '50px',
                        height: '50px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '50px',
                        height: '50px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '20px',
                        fontWeight: 'bold',
                        color: '#ffffff',
                      }}
                    >
                      {user.username?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: 600 }}>
                      {user.username || 'Sem nome'}
                    </h4>
                    <p style={{ margin: '0 0 6px 0', fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)' }}>
                      {user.email}
                    </p>
                    <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)' }}>
                      Criado em: {new Date(user.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h3
            style={{
              margin: '0 0 16px 0',
              fontSize: '18px',
              fontWeight: 600,
              color: '#ffffff',
              paddingBottom: '12px',
              borderBottom: '2px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            👑 Administradores
          </h3>
          {loading ? (
            <p style={{ color: 'rgba(255, 255, 255, 0.6)', textAlign: 'center', padding: '40px' }}>
              Carregando...
            </p>
          ) : adminUsers.length === 0 ? (
            <p style={{ color: 'rgba(255, 255, 255, 0.6)', textAlign: 'center', padding: '40px' }}>
              Nenhum administrador encontrado
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '600px', overflowY: 'auto' }}>
              {adminUsers.map((user) => (
                <div
                  key={user.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '15px',
                    padding: '15px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                >
                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.username}
                      style={{
                        width: '50px',
                        height: '50px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '50px',
                        height: '50px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '20px',
                        fontWeight: 'bold',
                        color: '#ffffff',
                      }}
                    >
                      {user.username?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: 600 }}>
                      {user.username || 'Sem nome'}
                    </h4>
                    <p style={{ margin: '0 0 6px 0', fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)' }}>
                      {user.email}
                    </p>
                    <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)' }}>
                      <span style={{ color: '#ffd700', fontWeight: 600 }}>👑 Admin</span> | Criado em:{' '}
                      {new Date(user.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}


