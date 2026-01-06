import { useState, useEffect } from 'react';

export const useMediaStream = (constraints: MediaStreamConstraints = { audio: true, video: true }) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let activeStream: MediaStream | null = null;

    const enableStream = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        setStream(mediaStream);
        activeStream = mediaStream;
      } catch (err) {
        setError(err as Error);
      }
    };

    enableStream();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [JSON.stringify(constraints)]);

  return { stream, error };
};