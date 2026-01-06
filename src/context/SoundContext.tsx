import React, { createContext, useCallback, useRef } from 'react';

interface SoundContextType {
  play: (soundName: string) => void;
}

export const SoundContext = createContext<SoundContextType | undefined>(undefined);

export const SoundProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const play = useCallback((soundName: string) => {
    // In a real app, you'd map names to file paths
    // const audio = new Audio(`/sounds/${soundName}.mp3`);
    // audio.play().catch(e => console.log('Audio play failed', e));
    console.log(`Playing sound: ${soundName}`);
  }, []);

  return (
    <SoundContext.Provider value={{ play }}>
      {children}
    </SoundContext.Provider>
  );
};
