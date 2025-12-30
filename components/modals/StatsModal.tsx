'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { formatTime } from '@/lib/utils/formatTime';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentVideoId: string | null;
}

export function StatsModal({ isOpen, onClose, currentVideoId }: StatsModalProps) {
  const [stats, setStats] = useState({
    totalVideos: 0,
    totalViews: 0,
    totalWatchTime: 0,
    currentVideoViews: 0,
    currentVideoWatchTime: 0,
  });
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (isOpen) {
      loadStats();
    }
  }, [isOpen, currentVideoId]);

  const loadStats = async () => {
    try {
      setLoading(true);

      // Estatísticas gerais
      const { count: videosCount } = await supabase
        .from('videos')
        .select('*', { count: 'exact', head: true });

      const { data: videosStats } = await supabase
        .from('videos')
        .select('views, watch_time');

      const totalViews = videosStats?.reduce((sum, v) => sum + (v.views || 0), 0) || 0;
      const totalWatchTime = videosStats?.reduce((sum, v) => sum + (v.watch_time || 0), 0) || 0;

      // Estatísticas do vídeo atual
      let currentVideoViews = 0;
      let currentVideoWatchTime = 0;

      if (currentVideoId) {
        const { data: currentVideo } = await supabase
          .from('videos')
          .select('views, watch_time')
          .eq('id', currentVideoId)
          .single();

        if (currentVideo) {
          currentVideoViews = currentVideo.views || 0;
          currentVideoWatchTime = currentVideo.watch_time || 0;
        }
      }

      setStats({
        totalVideos: videosCount || 0,
        totalViews,
        totalWatchTime,
        currentVideoViews,
        currentVideoWatchTime,
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

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'rgba(0, 0, 0, 0.85)',
        zIndex: 2000,
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
        style={{
          background: '#141414',
          borderRadius: '8px',
          width: '100%',
          maxWidth: '700px',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <h2 style={{ margin: 0, color: 'white', fontSize: '24px', fontWeight: 600 }}>
            Estatísticas
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: '32px',
              cursor: 'pointer',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
            }}
          >
            ×
          </button>
        </div>

        <div style={{ padding: '24px' }}>
          {loading ? (
            <p style={{ color: 'rgba(255, 255, 255, 0.6)', textAlign: 'center', padding: '40px' }}>
              Carregando...
            </p>
          ) : (
            <>
              {currentVideoId && (
                <div style={{ marginBottom: '32px' }}>
                  <h3 style={{ color: 'white', fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>
                    Vídeo Atual
                  </h3>
                  <div
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: '8px',
                      padding: '24px',
                      marginBottom: '16px',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: '36px', fontWeight: 700, color: '#e50914', marginBottom: '8px' }}>
                      {stats.currentVideoViews.toLocaleString()}
                    </div>
                    <div style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)' }}>
                      Visualizações
                    </div>
                  </div>
                  <div
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: '8px',
                      padding: '24px',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: '36px', fontWeight: 700, color: '#e50914', marginBottom: '8px' }}>
                      {formatWatchTime(stats.currentVideoWatchTime)}
                    </div>
                    <div style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)' }}>
                      Tempo Assistido
                    </div>
                  </div>
                </div>
              )}

              <div style={{ marginTop: '32px' }}>
                <h3 style={{ color: 'white', fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>
                  Estatísticas Gerais
                </h3>
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '8px',
                    padding: '24px',
                    marginBottom: '16px',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '36px', fontWeight: 700, color: '#e50914', marginBottom: '8px' }}>
                    {stats.totalVideos}
                  </div>
                  <div style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)' }}>
                    Total de Vídeos
                  </div>
                </div>
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '8px',
                    padding: '24px',
                    marginBottom: '16px',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '36px', fontWeight: 700, color: '#e50914', marginBottom: '8px' }}>
                    {stats.totalViews.toLocaleString()}
                  </div>
                  <div style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)' }}>
                    Total de Visualizações
                  </div>
                </div>
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '8px',
                    padding: '24px',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '36px', fontWeight: 700, color: '#e50914', marginBottom: '8px' }}>
                    {formatWatchTime(stats.totalWatchTime)}
                  </div>
                  <div style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)' }}>
                    Tempo Total Assistido
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

