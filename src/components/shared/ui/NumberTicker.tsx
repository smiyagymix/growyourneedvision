
import React, { useEffect, useState } from 'react';

interface NumberTickerProps {
  value: number;
  duration?: number; // ms
  formatter?: (val: number) => string;
}

export const NumberTicker: React.FC<NumberTickerProps> = ({ 
  value, 
  duration = 1000,
  formatter = (v) => v.toLocaleString() 
}) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const startValue = 0; // Or previous value if prop changes logic is added

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      
      // Ease out quart
      const ease = 1 - Math.pow(1 - progress, 4);
      
      setDisplayValue(Math.floor(startValue + (value - startValue) * ease));

      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };

    window.requestAnimationFrame(step);
  }, [value, duration]);

  return <span>{formatter(displayValue)}</span>;
};
