
import React from 'react';
import { Avatar } from './Avatar';

interface AvatarGroupProps {
  count?: number;
  limit?: number;
}

export const AvatarGroup: React.FC<AvatarGroupProps> = ({ count = 3, limit = 5 }) => {
  return (
    <div className="flex items-center -space-x-3">
        {[...Array(Math.min(count, limit))].map((_, i) => (
            <div key={i} className="ring-2 ring-white rounded-full">
                <Avatar size="md" initials={`U${i+1}`} />
            </div>
        ))}
        {count > limit && (
            <div className="w-10 h-10 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-xs font-bold text-gray-500 z-10">
                +{count - limit}
            </div>
        )}
    </div>
  );
};
