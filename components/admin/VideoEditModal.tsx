'use client';

import { useState, useEffect } from 'react';
import type { Video } from '@/types/video';

interface VideoEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (videoData: Partial<Video>) => Promise<void>;
  video?: Video | null;
}

export function VideoEditModal({ isOpen, onClose, onSave, video }: VideoEditModalProps) {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [thumbnail, setThumbnail] = useState('');
  const [duration, setDuration] = useState('');
  const [orderIndex, setOrderIndex] = useState<number>(0);
  const [userId, setUserId] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (video) {
      setTitle(video.title || '');
      setUrl(video.url || '');
      setThumbnail(video.thumbnail || '');
      setDuration(video.duration || '');
      setOrderIndex(video.order_index ?? 0);
      setUserId(video.user_id || '');
    } else {
      setTitle('');
      setUrl('');
      setThumbnail('');
      setDuration('');
      setOrderIndex(0);
      setUserId('');
    }
  }, [video, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !url.trim() || !thumbnail.trim()) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    setSaving(true);
    try {
      await onSave({
        id: video?.id,
        title: title.trim(),
        url: url.trim(),
        thumbnail: thumbnail.trim(),
        duration: duration.trim() || null,
        order_index: orderIndex,
        user_id: userId.trim() || null,
      });
      onClose();
    } catch (error) {
      console.error('Erro ao salvar vídeo:', error);
      alert('Erro ao salvar vídeo');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'rgba(0, 0, 0, 0.85)',
        zIndex: 3000,
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
          background: '#1a1a1a',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '600px',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
        }}
        onClick={(e) => e.stopPropagation()}
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
            {video ? 'Editar Vídeo' : 'Adicionar Novo Vídeo'}
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

        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          <div style={{ marginBottom: '20px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '8px',
                color: 'rgba(255, 255, 255, 0.9)',
                fontSize: '14px',
                fontWeight: 600,
              }}
            >
              Título do Vídeo *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="Digite o título do vídeo"
              maxLength={200}
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
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '8px',
                color: 'rgba(255, 255, 255, 0.9)',
                fontSize: '14px',
                fontWeight: 600,
              }}
            >
              URL do Vídeo *
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              placeholder="https://exemplo.com/video.mp4"
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
            <small style={{ display: 'block', marginTop: '6px', color: 'rgba(255, 255, 255, 0.5)', fontSize: '12px' }}>
              URL completa do arquivo de vídeo
            </small>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '8px',
                color: 'rgba(255, 255, 255, 0.9)',
                fontSize: '14px',
                fontWeight: 600,
              }}
            >
              URL da Thumbnail *
            </label>
            <input
              type="url"
              value={thumbnail}
              onChange={(e) => setThumbnail(e.target.value)}
              required
              placeholder="https://exemplo.com/thumbnail.jpg"
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
            <small style={{ display: 'block', marginTop: '6px', color: 'rgba(255, 255, 255, 0.5)', fontSize: '12px' }}>
              URL da imagem de capa do vídeo
            </small>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '8px',
                color: 'rgba(255, 255, 255, 0.9)',
                fontSize: '14px',
                fontWeight: 600,
              }}
            >
              Duração (formato: MM:SS)
            </label>
            <input
              type="text"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="3:22"
              pattern="[0-9]+:[0-5][0-9]"
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
            <small style={{ display: 'block', marginTop: '6px', color: 'rgba(255, 255, 255, 0.5)', fontSize: '12px' }}>
              Exemplo: 3:22 para 3 minutos e 22 segundos
            </small>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '8px',
                color: 'rgba(255, 255, 255, 0.9)',
                fontSize: '14px',
                fontWeight: 600,
              }}
            >
              Ordem de Exibição
            </label>
            <input
              type="number"
              value={orderIndex}
              onChange={(e) => setOrderIndex(parseInt(e.target.value) || 0)}
              min="0"
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
            <small style={{ display: 'block', marginTop: '6px', color: 'rgba(255, 255, 255, 0.5)', fontSize: '12px' }}>
              Números menores aparecem primeiro na fila
            </small>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '8px',
                color: 'rgba(255, 255, 255, 0.9)',
                fontSize: '14px',
                fontWeight: 600,
              }}
            >
              ID do Usuário (Uploader)
            </label>
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="UUID do usuário (opcional)"
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
            <small style={{ display: 'block', marginTop: '6px', color: 'rgba(255, 255, 255, 0.5)', fontSize: '12px' }}>
              Deixe em branco para manter o atual
            </small>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
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
              type="submit"
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
          </div>
        </form>
      </div>
    </div>
  );
}

