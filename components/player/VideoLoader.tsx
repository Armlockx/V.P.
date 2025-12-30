'use client';

interface VideoLoaderProps {
  isLoading: boolean;
  progress: number;
}

export function VideoLoader({ isLoading, progress }: VideoLoaderProps) {
  if (!isLoading) return null;

  return (
    <div
      className="video-loader"
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '6px',
      }}
    >
      <div className="loader-spinner" style={{ width: '50px', height: '50px', position: 'relative' }}>
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="spinner-segment"
            style={{
              position: 'absolute',
              width: '4px',
              height: '16px',
              background: 'rgba(255, 255, 255, 0.9)',
              borderRadius: '2px',
              top: '50%',
              left: '50%',
              transformOrigin: '0 25px',
              transform: `rotate(${i * 30}deg) translateY(-25px)`,
              opacity: 0.1 + (i / 12) * 0.9,
              animation: 'spinner-rotate 1.2s linear infinite',
              animationDelay: `${-i * 0.1}s`,
            }}
          />
        ))}
      </div>
      <div className="loader-percentage" style={{ color: 'white', fontSize: '14px' }}>
        {Math.round(progress)}%
      </div>
    </div>
  );
}

