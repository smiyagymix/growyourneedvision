import React from 'react';
import { OwnerIcon } from '../../../../components/shared/OwnerIcons';

export const AssetsPanel: React.FC = () => {
    const [activeCategory, setActiveCategory] = React.useState<'images' | 'shapes' | 'icons'>('shapes');

    const imageAssets = [
        { id: 'a1', type: 'image', src: 'https://picsum.photos/200/200?random=1', label: 'Nature' },
        { id: 'a2', type: 'image', src: 'https://picsum.photos/200/200?random=2', label: 'City' },
        { id: 'a3', type: 'image', src: 'https://picsum.photos/200/200?random=3', label: 'Tech' },
        { id: 'a4', type: 'image', src: 'https://picsum.photos/200/200?random=4', label: 'Abstract' },
    ];

    const shapeAssets = [
        { id: 's1', type: 'rect', label: 'Rectangle', icon: 'Square2Stack' },
        { id: 's2', type: 'circle', label: 'Circle', icon: 'CircleIcon' },
        { id: 's3', type: 'triangle', label: 'Triangle', icon: 'PlayIcon' },
        { id: 's4', type: 'star', label: 'Star', icon: 'StarIcon' },
        { id: 's5', type: 'polygon', label: 'Hexagon', icon: 'StopIcon' },
        { id: 's6', type: 'arrow', label: 'Arrow', icon: 'ArrowRightIcon' },
        { id: 's7', type: 'line', label: 'Line', icon: 'MinusIcon' },
        { id: 's8', type: 'ellipse', label: 'Ellipse', icon: 'EllipsisHorizontalCircleIcon' },
    ];

    const iconAssets = [
        { id: 'i1', type: 'icon', icon: 'Heart', label: 'Heart' },
        { id: 'i2', type: 'icon', icon: 'BoltIcon', label: 'Lightning' },
        { id: 'i3', type: 'icon', icon: 'SunIcon', label: 'Sun' },
        { id: 'i4', type: 'icon', icon: 'MoonIcon', label: 'Moon' },
        { id: 'i5', type: 'icon', icon: 'CloudIcon', label: 'Cloud' },
        { id: 'i6', type: 'icon', icon: 'FireIcon', label: 'Fire' },
    ];

    const assets = activeCategory === 'images' ? imageAssets : activeCategory === 'shapes' ? shapeAssets : iconAssets;

    const handleDragStart = (e: React.DragEvent, asset: any) => {
        e.dataTransfer.setData('application/json', JSON.stringify(asset));
        e.dataTransfer.effectAllowed = 'copy';
    };

    return (
        <div className="flex flex-col h-full">
            {/* Category Tabs */}
            <div className="flex border-b border-[#27272a] bg-[#1a1a1c]">
                <button
                    type="button"
                    onClick={() => setActiveCategory('shapes')}
                    className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${activeCategory === 'shapes' ? 'text-purple-400 border-b-2 border-purple-400 bg-[#1f1f22]' : 'text-gray-500 hover:text-white'}`}
                >
                    Shapes
                </button>
                <button
                    type="button"
                    onClick={() => setActiveCategory('icons')}
                    className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${activeCategory === 'icons' ? 'text-purple-400 border-b-2 border-purple-400 bg-[#1f1f22]' : 'text-gray-500 hover:text-white'}`}
                >
                    Icons
                </button>
                <button
                    type="button"
                    onClick={() => setActiveCategory('images')}
                    className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${activeCategory === 'images' ? 'text-purple-400 border-b-2 border-purple-400 bg-[#1f1f22]' : 'text-gray-500 hover:text-white'}`}
                >
                    Images
                </button>
            </div>

            <div className="p-4 border-b border-[#27272a] space-y-3">
                <div className="relative">
                    <OwnerIcon name="MagnifyingGlass" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Search assets..."
                        className="w-full bg-[#27272a] border border-[#3f3f46] rounded-lg py-2 pl-9 pr-4 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                    />
                </div>
                <button className="w-full py-2 bg-[#27272a] hover:bg-[#3f3f46] border border-[#3f3f46] rounded-lg text-xs font-bold text-gray-300 flex items-center justify-center gap-2 transition-colors">
                    <OwnerIcon name="ArrowUpTrayIcon" className="w-4 h-4" />
                    Upload Asset
                </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 gap-3">
                {assets.map(asset => (
                    <div
                        key={asset.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, asset)}
                        className="aspect-square bg-[#27272a] rounded-lg border border-[#3f3f46] hover:border-purple-500 cursor-grab active:cursor-grabbing transition-colors flex items-center justify-center group relative overflow-hidden"
                    >
                        {activeCategory === 'images' ? (
                            <>
                                <img src={asset.src} alt={asset.label} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity" />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                                    <span className="text-[10px] text-white font-medium truncate w-full">{asset.label}</span>
                                </div>
                            </>
                        ) : (
                            <>
                                <OwnerIcon name={asset.icon} className="w-12 h-12 text-gray-400 group-hover:text-purple-400 transition-colors" />
                                <div className="absolute bottom-2 left-2 right-2">
                                    <span className="text-[10px] text-gray-400 group-hover:text-white font-medium truncate w-full block text-center">{asset.label}</span>
                                </div>
                            </>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};
