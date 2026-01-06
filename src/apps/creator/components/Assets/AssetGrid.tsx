import React from 'react';

interface Asset {
  id: string;
  url: string;
  type: 'image' | 'video' | 'font';
  name: string;
}

interface AssetGridProps {
  assets: Asset[];
  onSelect: (asset: Asset) => void;
}

export const AssetGrid: React.FC<AssetGridProps> = ({ assets, onSelect }) => {
  return (
    <div className="grid grid-cols-2 gap-2 p-2">
      {assets.map((asset) => (
        <div
          key={asset.id}
          className="aspect-square bg-gray-800 rounded overflow-hidden cursor-pointer hover:ring-2 ring-blue-500 relative group"
          onClick={() => onSelect(asset)}
        >
          {asset.type === 'image' && (
            <img src={asset.url} alt={asset.name} className="w-full h-full object-cover" />
          )}
          <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-1 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity truncate">
            {asset.name}
          </div>
        </div>
      ))}
    </div>
  );
};
