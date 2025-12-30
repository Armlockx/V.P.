'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Video } from '@/types/video';
import { VideoEditModal } from './VideoEditModal';

export function VideoManager() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);
  const supabase = createClient();

  const loadVideos = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('videos')
        .select('*')
        .order('order_index', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.ilike('title', `%${searchTerm}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      if (data) {
        setVideos(data);
      }
    } catch (error) {
      console.error('Erro ao carregar vídeos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVideos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadVideos();
    }, 300);
    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  useEffect(() => {
    if (selectedVideoId) {
      const video = videos.find((v) => v.id === selectedVideoId);
      setSelectedVideo(video || null);
    } else {
      setSelectedVideo(null);
    }
  }, [selectedVideoId, videos]);

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

  const handleAddVideo = () => {
    setEditingVideo(null);
    setIsModalOpen(true);
  };

  const handleEditVideo = () => {
    if (!selectedVideo) {
      alert('Por favor, selecione um vídeo para editar.');
      return;
    }
    setEditingVideo(selectedVideo);
    setIsModalOpen(true);
  };

  const handleDeleteVideo = async () => {
    if (!selectedVideo) {
      alert('Por favor, selecione um vídeo para excluir.');
      return;
    }

    if (!confirm(`Tem certeza que deseja excluir o vídeo "${selectedVideo.title}"?\n\nEsta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      const { error } = await supabase.from('videos').delete().eq('id', selectedVideo.id);
      if (error) throw error;
      
      setSelectedVideoId(null);
      setSelectedVideo(null);
      await loadVideos();
      alert('Vídeo excluído com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir vídeo:', error);
      alert('Erro ao excluir vídeo: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
    }
  };

  const handleSaveVideo = async (videoData: Partial<Video>) => {
    try {
      if (videoData.id) {
        // Atualizar vídeo existente
        const { error } = await supabase
          .from('videos')
          .update({
            title: videoData.title,
            url: videoData.url,
            thumbnail: videoData.thumbnail,
            duration: videoData.duration || null,
            order_index: videoData.order_index !== undefined ? videoData.order_index : null,
            user_id: videoData.user_id || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', videoData.id);

        if (error) throw error;
        alert('Vídeo atualizado com sucesso!');
      } else {
        // Criar novo vídeo
        const { data: { session } } = await supabase.auth.getSession();
        const { error } = await supabase.from('videos').insert({
          title: videoData.title,
          url: videoData.url,
          thumbnail: videoData.thumbnail,
          duration: videoData.duration || null,
          order_index: videoData.order_index !== undefined ? videoData.order_index : null,
          user_id: videoData.user_id || session?.user?.id || null,
          views: 0,
          watch_time: 0,
        });

        if (error) throw error;
        alert('Vídeo criado com sucesso!');
      }

      await loadVideos();
      setIsModalOpen(false);
      setEditingVideo(null);
    } catch (error) {
      console.error('Erro ao salvar vídeo:', error);
      throw error;
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
        Gerenciamento de Vídeos
      </h2>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Buscar vídeos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
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
          onClick={loadVideos}
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
          Atualizar
        </button>
        <button
          onClick={handleAddVideo}
          style={{
            padding: '10px 20px',
            background: 'rgba(76, 175, 80, 0.2)',
            border: '1px solid rgba(76, 175, 80, 0.4)',
            borderRadius: '8px',
            color: '#4caf50',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          + Adicionar
        </button>
        <button
          onClick={handleEditVideo}
          disabled={!selectedVideo}
          style={{
            padding: '10px 20px',
            background: selectedVideo ? 'rgba(255, 193, 7, 0.2)' : 'rgba(255, 255, 255, 0.05)',
            border: selectedVideo ? '1px solid rgba(255, 193, 7, 0.4)' : '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            color: selectedVideo ? '#ffc107' : 'rgba(255, 255, 255, 0.3)',
            fontSize: '14px',
            fontWeight: 500,
            cursor: selectedVideo ? 'pointer' : 'not-allowed',
            opacity: selectedVideo ? 1 : 0.5,
          }}
        >
          ✏️ Editar
        </button>
        <button
          onClick={handleDeleteVideo}
          disabled={!selectedVideo}
          style={{
            padding: '10px 20px',
            background: selectedVideo ? 'rgba(255, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.05)',
            border: selectedVideo ? '1px solid rgba(255, 68, 68, 0.4)' : '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            color: selectedVideo ? '#ff6b6b' : 'rgba(255, 255, 255, 0.3)',
            fontSize: '14px',
            fontWeight: 500,
            cursor: selectedVideo ? 'pointer' : 'not-allowed',
            opacity: selectedVideo ? 1 : 0.5,
          }}
        >
          🗑️ Excluir
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '24px' }}>
        <div style={{ minHeight: '400px' }}>
          {loading ? (
            <p style={{ color: 'rgba(255, 255, 255, 0.6)', textAlign: 'center', padding: '40px' }}>
              Carregando...
            </p>
          ) : videos.length === 0 ? (
            <p style={{ color: 'rgba(255, 255, 255, 0.6)', textAlign: 'center', padding: '40px' }}>
              Nenhum vídeo encontrado
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {videos.map((video) => (
                <div
                  key={video.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '15px',
                    padding: '15px',
                    background:
                      selectedVideoId === video.id
                        ? 'rgba(255, 255, 255, 0.1)'
                        : 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (selectedVideoId !== video.id) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedVideoId !== video.id) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                    }
                  }}
                >
                  <input
                    type="radio"
                    name="selectedVideo"
                    id={`video-${video.id}`}
                    value={video.id}
                    checked={selectedVideoId === video.id}
                    onChange={() => setSelectedVideoId(video.id)}
                    style={{
                      width: '20px',
                      height: '20px',
                      cursor: 'pointer',
                      flexShrink: 0,
                    }}
                  />
                  <label
                    htmlFor={`video-${video.id}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '15px',
                      flex: 1,
                      cursor: 'pointer',
                    }}
                  >
                    <div
                      style={{
                        position: 'relative',
                        width: '120px',
                        height: '68px',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        background: 'rgba(255, 255, 255, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '32px',
                        flexShrink: 0,
                      }}
                    >
                      {video.thumbnail ? (
                        <img
                          src={video.thumbnail}
                          alt={video.title}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            if (e.currentTarget.parentElement) {
                              e.currentTarget.parentElement.innerHTML = '🎬';
                            }
                          }}
                        />
                      ) : (
                        '🎬'
                      )}
                      {video.duration && (
                        <div
                          style={{
                            position: 'absolute',
                            bottom: '4px',
                            right: '4px',
                            background: 'rgba(0, 0, 0, 0.85)',
                            color: 'white',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 600,
                          }}
                        >
                          {video.duration}
                        </div>
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 600 }}>
                        {video.title || 'Sem título'}
                      </h4>
                      <p
                        style={{
                          margin: '0 0 4px 0',
                          fontSize: '14px',
                          color: 'rgba(255, 255, 255, 0.6)',
                        }}
                      >
                        Views: {video.views || 0} | Tempo assistido: {formatWatchTime(video.watch_time || 0)} | Ordem:{' '}
                        {video.order_index !== null && video.order_index !== undefined ? video.order_index : 'N/A'}
                      </p>
                      <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255, 255, 255, 0.4)' }}>
                        Criado em: {new Date(video.created_at).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </label>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Preview */}
        <div
          style={{
            position: 'sticky',
            top: '20px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '20px',
            height: 'fit-content',
            maxHeight: 'calc(100vh - 100px)',
            overflowY: 'auto',
          }}
        >
          <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: 600, color: '#ffffff' }}>
            Preview do Vídeo
          </h3>
          {selectedVideo ? (
            <div>
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  aspectRatio: '16/9',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  background: 'rgba(255, 255, 255, 0.1)',
                  marginBottom: '16px',
                }}
              >
                <video
                  src={selectedVideo.url}
                  controls
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                  }}
                />
              </div>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: 600, color: '#ffffff' }}>
                {selectedVideo.title}
              </h4>
              <div
                style={{
                  padding: '12px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  marginBottom: '8px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                  <span style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Views:</span>
                  <span style={{ color: '#ffffff', fontWeight: 600 }}>{(selectedVideo.views || 0).toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                  <span style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Tempo assistido:</span>
                  <span style={{ color: '#ffffff', fontWeight: 600 }}>{formatWatchTime(selectedVideo.watch_time || 0)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                  <span style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Ordem:</span>
                  <span style={{ color: '#ffffff', fontWeight: 600 }}>
                    {selectedVideo.order_index !== null && selectedVideo.order_index !== undefined
                      ? selectedVideo.order_index
                      : 'N/A'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Criado em:</span>
                  <span style={{ color: '#ffffff', fontWeight: 600 }}>
                    {new Date(selectedVideo.created_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>
              <div
                style={{
                  padding: '12px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                <label
                  style={{
                    display: 'block',
                    marginBottom: '6px',
                    fontSize: '12px',
                    color: 'rgba(255, 255, 255, 0.6)',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                  }}
                >
                  URL do Vídeo:
                </label>
                <div
                  style={{
                    fontSize: '11px',
                    color: 'rgba(255, 255, 255, 0.8)',
                    wordBreak: 'break-all',
                    fontFamily: 'Courier New, monospace',
                    lineHeight: '1.5',
                    maxHeight: '60px',
                    overflowY: 'auto',
                  }}
                >
                  {selectedVideo.url}
                </div>
              </div>
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '60px 20px',
                textAlign: 'center',
                color: 'rgba(255, 255, 255, 0.5)',
              }}
            >
              <div style={{ fontSize: '64px', marginBottom: '16px', opacity: 0.5 }}>🎬</div>
              <p style={{ margin: 0, fontSize: '14px' }}>Selecione um vídeo para visualizar o preview</p>
            </div>
          )}
        </div>
      </div>

      <VideoEditModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingVideo(null);
        }}
        onSave={handleSaveVideo}
        video={editingVideo}
      />
    </section>
  );
}


