'use client';

import { formatTime } from '@/lib/utils/formatTime';
import { useLikes } from '@/lib/hooks/useLikes';
import { useComments } from '@/lib/hooks/useComments';
import { useState } from 'react';
import { CommentsModal } from '../modals/CommentsModal';

interface VideoControlsProps {
  player: ReturnType<typeof import('@/lib/hooks/useVideoPlayer').useVideoPlayer>;
  visible: boolean;
  onQueueToggle: () => void;
  onAuthRequired?: () => void;
  isGuest?: boolean;
}

export function VideoControls({ player, visible, onQueueToggle, onAuthRequired, isGuest = false }: VideoControlsProps) {
  const likes = useLikes(player.currentVideo?.id || null);
  const { comments } = useComments(player.currentVideo?.id || null);
  const [commentsModalOpen, setCommentsModalOpen] = useState(false);

  const handleLikeClick = () => {
    if (isGuest && onAuthRequired) {
      onAuthRequired();
    } else {
      likes.toggleLike();
    }
  };

  const progressPercent = player.duration > 0 
    ? (player.currentTime / player.duration) * 100 
    : 0;

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newTime = percent * player.duration;
    player.seek(newTime);
  };

  return (
    <>
      <div 
        className={`controls ${visible ? '' : 'hidden'}`}
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          width: '100%',
          zIndex: 10,
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.3s ease',
          pointerEvents: visible ? 'auto' : 'none',
        }}
      >
        <div 
          className="progress-container"
          onClick={handleProgressClick}
          style={{
            width: '100%',
            height: '5px',
            background: 'rgba(255,255,255,0.3)',
            cursor: 'pointer',
            transition: 'height 0.2s ease',
          }}
        >
          <div
            className="progress"
            style={{
              height: '100%',
              width: `${progressPercent}%`,
              background: 'red',
              transition: 'width 0.1s ease',
            }}
          />
        </div>

        <div 
          className="controls-row"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px',
            background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
            position: 'relative',
          }}
        >
          <button
            onClick={player.togglePlayPause}
            style={{
              width: '40px',
              height: '40px',
              background: 'rgba(255, 255, 255, 0.5)',
              border: 'none',
              borderRadius: '50%',
              color: 'white',
              fontSize: '18px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {player.isPlaying ? '⏸' : '▶'}
          </button>

          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={player.volume}
            onChange={(e) => player.changeVolume(parseFloat(e.target.value))}
            style={{
              width: '100px',
              height: '5px',
              cursor: 'pointer',
            }}
          />

          <div className="time" style={{ color: 'white', fontSize: '14px' }}>
            {formatTime(player.currentTime)} / {formatTime(player.duration)}
          </div>

          {/* Like Button */}
          <button
            onClick={handleLikeClick}
            className={`like-btn ${likes.liked ? 'liked' : ''}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              background: likes.liked ? 'rgba(255, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.1)',
              borderRadius: '20px',
              border: 'none',
              color: 'white',
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            <span className="like-icon" style={{ fontSize: '18px' }}>
              {likes.liked ? '❤️' : '♡'}
            </span>
            <span className="like-count" style={{ fontSize: '13px', fontWeight: 500 }}>
              {likes.likeCount}
            </span>
          </button>

          {/* Comments Button */}
          <button
            onClick={() => setCommentsModalOpen(true)}
            className="comments-btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '20px',
              border: 'none',
              color: 'white',
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            <span className="comments-icon" style={{ fontSize: '18px' }}>💬</span>
            <span className="comments-count" style={{ fontSize: '13px', fontWeight: 500 }}>
              {comments.length}
            </span>
          </button>

          {/* Queue Button - Floating on the right */}
          <button
            onClick={onQueueToggle}
            style={{
              position: 'absolute',
              right: '50px',
              width: '40px',
              height: '40px',
              background: 'rgba(0, 0, 0, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '20px',
              zIndex: 11,
            }}
          >
            <span style={{ position: 'relative' }}>
              ☰
              {player.videos.length > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-8px',
                    right: '-8px',
                    background: 'red',
                    color: 'white',
                    fontSize: '10px',
                    padding: '2px 6px',
                    borderRadius: '10px',
                    minWidth: '18px',
                    textAlign: 'center',
                  }}
                >
                  {player.videos.length}
                </span>
              )}
            </span>
          </button>

          {/* Fullscreen Button - Floating on the right */}
          <button
            onClick={player.toggleFullscreen}
            style={{
              position: 'absolute',
              right: '10px',
              background: 'none',
              border: 'none',
              color: 'white',
              fontSize: '18px',
              cursor: 'pointer',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 11,
            }}
          >
            ⛶
          </button>
        </div>
      </div>

      <CommentsModal
        isOpen={commentsModalOpen}
        onClose={() => setCommentsModalOpen(false)}
        videoId={player.currentVideo?.id || null}
      />
    </>
  );
}
