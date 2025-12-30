'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Video } from '@/types/video';

export function useVideoPlayer() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [videos, setVideos] = useState<Video[]>([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [controlsVisible, setControlsVisible] = useState(true);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const supabase = createClient();

  // Buscar vídeos do Supabase
  const fetchVideos = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .order('order_index', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) {
        setVideos(data);
        if (data.length > 0 && videoRef.current) {
          videoRef.current.src = data[0].url;
        }
      }
    } catch (error) {
      console.error('Erro ao buscar vídeos:', error);
    }
  }, [supabase]);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  // Controles de reprodução
  const togglePlayPause = useCallback(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying]);

  const seek = useCallback((time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  const seekForward = useCallback((seconds: number = 5) => {
    if (videoRef.current) {
      const newTime = Math.min(videoRef.current.currentTime + seconds, duration);
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  }, [duration]);

  const seekBackward = useCallback((seconds: number = 5) => {
    if (videoRef.current) {
      const newTime = Math.max(videoRef.current.currentTime - seconds, 0);
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  }, []);

  const increaseVolume = useCallback((step: number = 0.1) => {
    if (videoRef.current) {
      const newVolume = Math.min(volume + step, 1);
      videoRef.current.volume = newVolume;
      setVolume(newVolume);
    }
  }, [volume]);

  const decreaseVolume = useCallback((step: number = 0.1) => {
    if (videoRef.current) {
      const newVolume = Math.max(volume - step, 0);
      videoRef.current.volume = newVolume;
      setVolume(newVolume);
    }
  }, [volume]);

  const changeVolume = useCallback((vol: number) => {
    if (videoRef.current) {
      videoRef.current.volume = vol;
      setVolume(vol);
    }
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement && videoRef.current) {
      videoRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  const nextVideo = useCallback(() => {
    if (currentVideoIndex < videos.length - 1) {
      const nextIndex = currentVideoIndex + 1;
      setCurrentVideoIndex(nextIndex);
      if (videoRef.current) {
        videoRef.current.src = videos[nextIndex].url;
        videoRef.current.play();
      }
    }
  }, [currentVideoIndex, videos]);

  const previousVideo = useCallback(() => {
    if (currentVideoIndex > 0) {
      const prevIndex = currentVideoIndex - 1;
      setCurrentVideoIndex(prevIndex);
      if (videoRef.current) {
        videoRef.current.src = videos[prevIndex].url;
        videoRef.current.play();
      }
    }
  }, [currentVideoIndex, videos]);

  const playVideo = useCallback((index: number) => {
    if (index >= 0 && index < videos.length) {
      setCurrentVideoIndex(index);
      if (videoRef.current) {
        videoRef.current.src = videos[index].url;
        videoRef.current.play();
        setIsPlaying(true);
      }
    }
  }, [videos]);

  // Event handlers do vídeo
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handleDurationChange = () => setDuration(video.duration);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleLoadStart = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);
    const handleProgress = () => {
      if (video.buffered.length > 0) {
        const buffered = video.buffered.end(video.buffered.length - 1);
        const progress = (buffered / video.duration) * 100;
        setLoadProgress(progress);
      }
    };
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('durationchange', handleDurationChange);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('loadstart', handleLoadStart);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('progress', handleProgress);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('durationchange', handleDurationChange);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('loadstart', handleLoadStart);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('progress', handleProgress);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Controles automáticos (esconder após inatividade)
  const resetControlsTimeout = useCallback(() => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    setControlsVisible(true);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setControlsVisible(false);
      }
    }, 3000);
  }, [isPlaying]);

  useEffect(() => {
    resetControlsTimeout();
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [resetControlsTimeout]);

  return {
    videoRef,
    isPlaying,
    currentTime,
    duration,
    volume,
    isFullscreen,
    isLoading,
    loadProgress,
    videos,
    currentVideoIndex,
    currentVideo: videos[currentVideoIndex] || null,
    controlsVisible,
    togglePlayPause,
    seek,
    seekForward,
    seekBackward,
    changeVolume,
    increaseVolume,
    decreaseVolume,
    toggleFullscreen,
    nextVideo,
    previousVideo,
    playVideo,
    resetControlsTimeout,
    fetchVideos,
  };
}


