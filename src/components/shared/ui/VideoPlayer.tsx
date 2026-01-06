import React, { useState, useRef, useEffect } from 'react';
import { OwnerIcon } from '../OwnerIcons';
import Hls from 'hls.js';

interface VideoPlayerProps {
  src: string;
  poster?: string;
  title?: string;
  autoPlay?: boolean;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ src, poster, title, autoPlay = false }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let hls: Hls | null = null;

    if (Hls.isSupported() && src.endsWith('.m3u8')) {
      hls = new Hls();
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (autoPlay) {
          video.play().catch(e => console.log('Autoplay prevented:', e));
          setIsPlaying(true);
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS support (Safari)
      video.src = src;
      if (autoPlay) {
        video.addEventListener('loadedmetadata', () => {
          video.play().catch(e => console.log('Autoplay prevented:', e));
          setIsPlaying(true);
        });
      }
    } else {
      // Standard video
      video.src = src;
      if (autoPlay) {
        video.play().catch(e => console.log('Autoplay prevented:', e));
        setIsPlaying(true);
      }
    }

    return () => {
      if (hls) {
        hls.destroy();
      }
    };
  }, [src, autoPlay]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleVideoPlay = () => setIsPlaying(true);
  const handleVideoPause = () => setIsPlaying(false);

  return (
    <div className="relative rounded-2xl overflow-hidden bg-black border border-gray-800 shadow-2xl group aspect-video">
      <video
        ref={videoRef}
        poster={poster}
        className="w-full h-full object-cover"
        onClick={togglePlay}
        onPlay={handleVideoPlay}
        onPause={handleVideoPause}
        playsInline
      />

      {/* Title Overlay */}
      {title && (
        <div className="absolute top-0 left-0 w-full p-4 bg-gradient-to-b from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          <h3 className="text-white font-bold text-sm drop-shadow-md">{title}</h3>
        </div>
      )}

      {/* Play Button Overlay */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/40 shadow-lg group-hover:scale-110 transition-transform">
            <OwnerIcon name="PlayIcon" className="w-8 h-8 text-white fill-white ml-1" />
          </div>
        </div>
      )}

      {/* Controls Overlay */}
      <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center gap-4">
        <button type="button" onClick={togglePlay} className="text-white hover:text-gyn-blue-light">
          <OwnerIcon name={isPlaying ? "PauseIcon" : "PlayIcon"} className="w-5 h-5" />
        </button>
        {/* Progress Bar Simulator */}
        <div className="flex-1 h-1 bg-gray-600 rounded-full overflow-hidden">
          <div className="h-full bg-gyn-blue-medium w-1/3 relative">
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow"></div>
          </div>
        </div>
        <span className="text-xs text-gray-300 font-mono">LIVE</span>
        <button type="button" className="text-white hover:text-gray-300"><OwnerIcon name="SpeakerWaveIcon" className="w-5 h-5" /></button>
        <button type="button" className="text-white hover:text-gray-300"><OwnerIcon name="ArrowsExpandIcon" className="w-5 h-5" /></button>
      </div>
    </div>
  );
};
