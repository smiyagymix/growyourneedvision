
import React, { useEffect, useRef } from 'react';

export const Globe: React.FC<{ className?: string }> = ({ className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rotation = 0;
    let animationFrameId: number;

    const draw = () => {
      if (!ctx || !canvas) return;
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = Math.min(centerX, centerY) - 10;

      ctx.strokeStyle = 'rgba(48, 65, 199, 0.3)';
      ctx.lineWidth = 1;

      // Draw Sphere
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.stroke();

      // Draw Longitude lines
      for (let i = 0; i < 8; i++) {
        const offset = (i * Math.PI) / 4 + rotation;
        const xScale = Math.cos(offset);
        
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, radius * Math.abs(xScale), radius, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Draw Latitude lines (simple flat ovals)
      for (let i = 1; i < 5; i++) {
        const yOffset = (radius / 2.5) * (i - 2.5);
        const currentRadius = Math.sqrt(radius * radius - yOffset * yOffset);
        
        ctx.beginPath();
        // Perspective tilt
        ctx.ellipse(centerX, centerY + yOffset, currentRadius, currentRadius * 0.3, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      rotation += 0.005;
      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  return (
    <canvas ref={canvasRef} width={300} height={300} className={`w-full h-full ${className}`} />
  );
};
