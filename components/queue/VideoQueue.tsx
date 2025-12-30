'use client';

import { useState, useEffect } from 'react';
import { Video } from '@/types/video';
import { formatTime } from '@/lib/utils/formatTime';

interface VideoQueueProps {
  videos: Video[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onSelectVideo: (index: number) => void;
  onUploadClick?: () => void;
  onStatsClick?: () => void;
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
}

export function VideoQueue({ 
  videos, 
  currentIndex, 
  isOpen, 
  onClose, 
  onSelectVideo,
  onUploadClick,
  onStatsClick,
  searchTerm = '',
  onSearchChange,
}: VideoQueueProps) {
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);
  
  useEffect(() => {
    setLocalSearchTerm(searchTerm);
  }, [searchTerm]);
  
  const filteredVideos = localSearchTerm
    ? videos.filter(v => v.title.toLowerCase().includes(localSearchTerm.toLowerCase()))
    : videos;

  if (!isOpen) return null;

  return (
    <div
      className="queue-menu"
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        bottom: '80px',
        width: '360px',
        maxHeight: 'calc(100vh - 100px)',
        background: 'rgba(255, 255, 255, 0.08)',
        border: '1px solid rgba(255, 255, 255, 0.18)',
        borderRadius: '16px',
        boxShadow: '0 -8px 32px rgba(0, 0, 0, 0.4)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        backdropFilter: 'blur(40px)',
        transform: isOpen ? 'translateX(0)' : 'translateX(calc(100% + 20px))',
        opacity: isOpen ? 1 : 0,
        transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.4s ease',
        pointerEvents: isOpen ? 'auto' : 'none',
      }}
    >
      <div
        className="queue-header"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '18px 20px',
          background: 'rgba(255, 255, 255, 0.05)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px 16px 0 0',
        }}
      >
        <div>
          <h3 style={{ margin: '0 0 4px 0', color: 'white', fontSize: '16px', fontWeight: 600 }}>
            Fila de Reprodução
          </h3>
          <span style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '12px' }}>
            {filteredVideos.length} vídeos
          </span>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            border: 'none',
            color: 'white',
            fontSize: '24px',
            cursor: 'pointer',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          ×
        </button>
      </div>

      {/* Barra de ações */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '12px 20px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(255, 255, 255, 0.03)',
        }}
      >
        <input
          type="text"
          value={localSearchTerm}
          onChange={(e) => {
            setLocalSearchTerm(e.target.value);
            onSearchChange?.(e.target.value);
          }}
          placeholder="Buscar..."
          style={{
            flex: 1,
            padding: '8px 12px',
            background: 'rgba(255, 255, 255, 0.12)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '8px',
            color: 'white',
            fontSize: '13px',
            outline: 'none',
          }}
        />
        {onUploadClick && (
          <button
            onClick={onUploadClick}
            title="Adicionar vídeo"
            style={{
              width: '36px',
              height: '36px',
              padding: 0,
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(135deg, #e50914, #f40612)',
              color: 'white',
              fontSize: '18px',
              boxShadow: '0 2px 8px rgba(229, 9, 20, 0.3)',
            }}
          >
            +
          </button>
        )}
        {onStatsClick && (
          <button
            onClick={onStatsClick}
            title="Estatísticas"
            style={{
              width: '36px',
              height: '36px',
              padding: 0,
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(255, 255, 255, 0.12)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: 'white',
              fontSize: '18px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
            }}
          >
            📊
          </button>
        )}
      </div>

      <ul
        className="queue-list"
        style={{
          listStyle: 'none',
          padding: 0,
          margin: 0,
          overflowY: 'auto',
          flex: 1,
        }}
      >
        {filteredVideos.map((video, index) => {
          const originalIndex = videos.findIndex(v => v.id === video.id);
          return (
          <li
            key={video.id}
            onClick={() => onSelectVideo(originalIndex)}
            className={`queue-item ${originalIndex === currentIndex ? 'active' : ''}`}
            style={{
              padding: '12px 20px',
              cursor: 'pointer',
              borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
              background: originalIndex === currentIndex ? 'rgba(255, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.01)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <div
              className="queue-item-thumbnail"
              style={{
                width: '80px',
                height: '50px',
                borderRadius: '6px',
                overflow: 'hidden',
                flexShrink: 0,
                background: 'rgba(255, 255, 255, 0.1)',
              }}
            >
              {video.thumbnail ? (
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                  🎬
                </div>
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                className="queue-item-title"
                style={{
                  fontSize: '13px',
                  fontWeight: originalIndex === currentIndex ? 600 : 500,
                  color: 'white',
                  marginBottom: '3px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {video.title}
              </div>
              <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)', display: 'flex', gap: '8px', alignItems: 'center' }}>
                {video.duration && <span>{video.duration}</span>}
                {video.views !== undefined && video.views > 0 && (
                  <>
                    {video.duration && <span>•</span>}
                    <span>{video.views.toLocaleString()} views</span>
                  </>
                )}
              </div>
            </div>
          </li>
        );
        })}
      </ul>
    </div>
  );
}


