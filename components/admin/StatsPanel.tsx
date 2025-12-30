'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Stats {
  totalVideos: number;
  totalViews: number;
  totalWatchTime: number;
  totalUsers: number;
  totalAdmins: number;
}

export function StatsPanel() {
  const [stats, setStats] = useState<Stats>({
    totalVideos: 0,
    totalViews: 0,
    totalWatchTime: 0,
    totalUsers: 0,
    totalAdmins: 0,
  });
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);

      // Estatísticas de vídeos
      const { count: videosCount } = await supabase
        .from('videos')
        .select('*', { count: 'exact', head: true });

      const { data: videosStats } = await supabase.from('videos').select('views, watch_time');

      const totalViews = videosStats?.reduce((sum, v) => sum + (v.views || 0), 0) || 0;
      const totalWatchTime = videosStats?.reduce((sum, v) => sum + (v.watch_time || 0), 0) || 0;

      // Estatísticas de usuários
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      const { count: adminsCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_admin', true);

      setStats({
        totalVideos: videosCount || 0,
        totalViews,
        totalWatchTime,
        totalUsers: usersCount || 0,
        totalAdmins: adminsCount || 0,
      });
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatWatchTime = (seconds: number): string => {
    if (!seconds || seconds < 0) return '0s';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

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
        Estatísticas Gerais
      </h2>

      {loading ? (
        <p style={{ color: 'rgba(255, 255, 255, 0.6)', textAlign: 'center', padding: '40px' }}>
          Carregando...
        </p>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '20px',
            marginTop: '20px',
          }}
        >
          <div
            style={{
              padding: '25px',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '36px', fontWeight: 700, marginBottom: '10px', color: '#ffffff' }}>
              {stats.totalVideos}
            </div>
            <div style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.6)', textTransform: 'uppercase' }}>
              Total de Vídeos
            </div>
          </div>

          <div
            style={{
              padding: '25px',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '36px', fontWeight: 700, marginBottom: '10px', color: '#ffffff' }}>
              {stats.totalViews.toLocaleString()}
            </div>
            <div style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.6)', textTransform: 'uppercase' }}>
              Total de Visualizações
            </div>
          </div>

          <div
            style={{
              padding: '25px',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '36px', fontWeight: 700, marginBottom: '10px', color: '#ffffff' }}>
              {formatWatchTime(stats.totalWatchTime)}
            </div>
            <div style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.6)', textTransform: 'uppercase' }}>
              Tempo Total Assistido
            </div>
          </div>

          <div
            style={{
              padding: '25px',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '36px', fontWeight: 700, marginBottom: '10px', color: '#ffffff' }}>
              {stats.totalUsers}
            </div>
            <div style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.6)', textTransform: 'uppercase' }}>
              Total de Usuários
            </div>
          </div>

          <div
            style={{
              padding: '25px',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '36px', fontWeight: 700, marginBottom: '10px', color: '#ffffff' }}>
              {stats.totalAdmins}
            </div>
            <div style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.6)', textTransform: 'uppercase' }}>
              Administradores
            </div>
          </div>
        </div>
      )}
    </section>
  );
}


