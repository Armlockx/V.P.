'use client';

import { useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/hooks/useAuth';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVideoAdded: () => void;
}

export function UploadModal({ isOpen, onClose, onVideoAdded }: UploadModalProps) {
  const [title, setTitle] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [duration, setDuration] = useState('');
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const thumbnailPreviewRef = useRef<HTMLImageElement>(null);
  const supabase = createClient();
  const auth = useAuth();

  if (!isOpen) return null;

  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setVideoFile(file);

    // Preview do vídeo
    if (videoPreviewRef.current) {
      const url = URL.createObjectURL(file);
      videoPreviewRef.current.src = url;
      videoPreviewRef.current.style.display = 'block';

      // Calcular duração
      videoPreviewRef.current.onloadedmetadata = () => {
        const videoDuration = videoPreviewRef.current?.duration || 0;
        const minutes = Math.floor(videoDuration / 60);
        const seconds = Math.floor(videoDuration % 60);
        setDuration(`${minutes}:${seconds.toString().padStart(2, '0')}`);
      };
    }
  };

  const handleThumbnailFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setThumbnailFile(file);

    // Preview da thumbnail
    if (thumbnailPreviewRef.current) {
      const url = URL.createObjectURL(file);
      thumbnailPreviewRef.current.src = url;
      thumbnailPreviewRef.current.style.display = 'block';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!title.trim()) {
      setError('Por favor, insira um título');
      return;
    }

    if (!videoFile) {
      setError('Por favor, selecione um arquivo de vídeo');
      return;
    }

    if (!thumbnailFile) {
      setError('Por favor, selecione uma thumbnail');
      return;
    }

    if (!auth.user && !auth.isGuest) {
      setError('Você precisa estar logado para fazer upload');
      return;
    }

    setLoading(true);
    setProgress(0);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id || null;

      // Upload do vídeo
      setProgress(10);
      const videoFileName = `${Date.now()}_${videoFile.name}`;
      const { data: videoData, error: videoError } = await supabase.storage
        .from('v-p-player')
        .upload(`Videos/${videoFileName}`, videoFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (videoError) throw new Error(`Erro ao fazer upload do vídeo: ${videoError.message}`);

      // Upload da thumbnail
      setProgress(50);
      const thumbnailFileName = `${Date.now()}_${thumbnailFile.name}`;
      const { data: thumbnailData, error: thumbnailError } = await supabase.storage
        .from('v-p-player')
        .upload(`Thumbnails/${thumbnailFileName}`, thumbnailFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (thumbnailError) throw new Error(`Erro ao fazer upload da thumbnail: ${thumbnailError.message}`);

      // Obter URLs públicas
      const { data: videoUrlData } = supabase.storage
        .from('v-p-player')
        .getPublicUrl(`Videos/${videoFileName}`);

      const { data: thumbnailUrlData } = supabase.storage
        .from('v-p-player')
        .getPublicUrl(`Thumbnails/${thumbnailFileName}`);

      // Obter próximo order_index
      setProgress(80);
      const { data: videos } = await supabase
        .from('videos')
        .select('order_index')
        .order('order_index', { ascending: false })
        .limit(1);

      const nextOrderIndex = videos && videos.length > 0 ? (videos[0].order_index || 0) + 1 : 1;

      // Salvar no banco de dados
      const { error: dbError } = await supabase
        .from('videos')
        .insert([
          {
            title: title.trim(),
            url: videoUrlData.publicUrl,
            thumbnail: thumbnailUrlData.publicUrl,
            duration: duration || null,
            order_index: nextOrderIndex,
            user_id: userId,
            views: 0,
            watch_time: 0,
          },
        ]);

      if (dbError) throw new Error(`Erro ao salvar no banco de dados: ${dbError.message}`);

      setProgress(100);
      setSuccess('Vídeo adicionado com sucesso!');

      // Limpar formulário
      setTimeout(() => {
        setTitle('');
        setVideoFile(null);
        setThumbnailFile(null);
        setDuration('');
        setProgress(0);
        if (videoPreviewRef.current) {
          videoPreviewRef.current.src = '';
          videoPreviewRef.current.style.display = 'none';
        }
        if (thumbnailPreviewRef.current) {
          thumbnailPreviewRef.current.src = '';
          thumbnailPreviewRef.current.style.display = 'none';
        }
        onVideoAdded();
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer upload do vídeo');
      setProgress(0);
    } finally {
      setLoading(false);
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
          maxWidth: '600px',
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
            Adicionar Novo Vídeo
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
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', color: 'white', fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>
              Título do Vídeo *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="Digite o título do vídeo"
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '4px',
                color: 'white',
                fontSize: '16px',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', color: 'white', fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>
              Arquivo de Vídeo *
            </label>
            <input
              type="file"
              accept="video/*"
              onChange={handleVideoFileChange}
              required
              style={{ color: 'white', marginBottom: '12px' }}
            />
            <video
              ref={videoPreviewRef}
              style={{
                width: '100%',
                maxHeight: '300px',
                display: 'none',
                borderRadius: '4px',
                marginTop: '12px',
              }}
              controls
            />
            {duration && (
              <div style={{ marginTop: '8px', color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px' }}>
                Duração: <span style={{ color: '#e50914', fontWeight: 600 }}>{duration}</span>
              </div>
            )}
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', color: 'white', fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>
              Thumbnail (Imagem) *
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleThumbnailFileChange}
              required
              style={{ color: 'white', marginBottom: '12px' }}
            />
            <img
              ref={thumbnailPreviewRef}
              style={{
                width: '100%',
                maxHeight: '200px',
                objectFit: 'contain',
                display: 'none',
                borderRadius: '4px',
                marginTop: '12px',
              }}
              alt="Preview thumbnail"
            />
          </div>

          {progress > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <div
                style={{
                  width: '100%',
                  height: '8px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '4px',
                  overflow: 'hidden',
                  marginBottom: '8px',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${progress}%`,
                    background: 'linear-gradient(90deg, #e50914, #f40612)',
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
              <span style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px' }}>{progress}%</span>
            </div>
          )}

          {error && (
            <div
              style={{
                padding: '12px 16px',
                background: 'rgba(244, 67, 54, 0.2)',
                border: '1px solid rgba(244, 67, 54, 0.3)',
                borderRadius: '4px',
                color: '#f44336',
                fontSize: '14px',
                marginBottom: '16px',
              }}
            >
              {error}
            </div>
          )}

          {success && (
            <div
              style={{
                padding: '12px 16px',
                background: 'rgba(76, 175, 80, 0.2)',
                border: '1px solid rgba(76, 175, 80, 0.3)',
                borderRadius: '4px',
                color: '#4caf50',
                fontSize: '14px',
                marginBottom: '16px',
              }}
            >
              {success}
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{
                padding: '12px 24px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                borderRadius: '4px',
                color: 'white',
                fontSize: '16px',
                fontWeight: 500,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.5 : 1,
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '12px 24px',
                background: loading ? 'rgba(255, 255, 255, 0.2)' : '#e50914',
                border: 'none',
                borderRadius: '4px',
                color: 'white',
                fontSize: '16px',
                fontWeight: 500,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? 'Enviando...' : 'Enviar Vídeo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

