import { useState, useEffect } from 'react';

export const useSound = (url: string) => {
  const [audio] = useState(new Audio(url));
  const [playing, setPlaying] = useState(false);

  const play = () => {
    audio.play().then(() => setPlaying(true)).catch(console.error);
  };

  const stop = () => {
    audio.pause();
    audio.currentTime = 0;
    setPlaying(false);
  };

  useEffect(() => {
    audio.addEventListener('ended', () => setPlaying(false));
    return () => {
      audio.removeEventListener('ended', () => setPlaying(false));
      audio.pause();
    };
  }, [audio]);

  return { play, stop, playing };
};