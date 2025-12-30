'use client';

import { useRef, useEffect } from 'react';

interface VideoPlayerProps {
  src: string;
  onTimeUpdate?: (time: number) => void;
  onLoadedMetadata?: (duration: number) => void;
  onPlay?: () => void;
  onPause?: () => void;
}

export function VideoPlayer({
  src,
  onTimeUpdate,
  onLoadedMetadata,
  onPlay,
  onPause,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      onTimeUpdate?.(video.currentTime);
    };

    const handleLoadedMetadata = () => {
      onLoadedMetadata?.(video.duration);
    };

    const handlePlay = () => onPlay?.();
    const handlePause = () => onPause?.();

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, [onTimeUpdate, onLoadedMetadata, onPlay, onPause]);

  return (
    <video
      ref={videoRef}
      src={src}
      className="w-full h-full object-contain"
    />
  );
}


