
import React from 'react';
import { OwnerIcon } from '../OwnerIcons';

interface RatingProps {
  value: number; // 0 to 5
  onChange?: (val: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md';
}

export const Rating: React.FC<RatingProps> = ({ value, onChange, readonly = false, size = 'md' }) => {
  const stars = [1, 2, 3, 4, 5];
  const sizeClass = size === 'sm' ? 'w-4 h-4' : 'w-6 h-6';

  return (
    <div className="flex items-center gap-1">
        {stars.map((star) => (
            <button
                key={star}
                type="button"
                disabled={readonly}
                onClick={() => onChange && onChange(star)}
                className={`transition-transform ${!readonly ? 'hover:scale-110' : ''} ${star <= value ? 'text-yellow-400' : 'text-gray-300'}`}
            >
                <OwnerIcon name="StarIcon" className={`${sizeClass}`} />
            </button>
        ))}
    </div>
  );
};
