import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, Icon, Badge } from '../shared/ui/CommonUI';
import { assetService, MarketingAsset } from '../../services/assetService';

export const AssetLibrary: React.FC = () => {
    const [assets, setAssets] = useState<MarketingAsset[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchAssets = async () => {
        setLoading(true);
        const data = await assetService.getAssets();
        setAssets(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchAssets();
    }, []);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            let type: 'Image' | 'Video' | 'Document' = 'Document';
            if (file.type.startsWith('image/')) type = 'Image';
            else if (file.type.startsWith('video/')) type = 'Video';

            await assetService.uploadAsset(file, file.name, type);
            await fetchAssets();
        } catch (error) {
            console.error('Upload failed', error);
            alert('Upload failed');
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Delete this asset?')) return;
        await assetService.deleteAsset(id);
        setAssets(assets.filter(a => a.id !== id));
    };

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    return (
        <div className="space-y-2">
            <div className="flex justify-between items-center">
                <h3 className="font-bold text-sm text-gray-800 dark:text-white">Asset Library</h3>
                <div>
                    <input 
                        type="file" 
                        ref={fileInputRef}
                        className="hidden" 
                        onChange={handleFileUpload}
                        accept="image/*,video/*,application/pdf"
                    />
                    <Button 
                        size="sm" 
                        variant="primary" 
                        icon="ArrowUpTrayIcon" 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                    >
                        {uploading ? 'Uploading...' : 'Upload Asset'}
                    </Button>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-8 text-gray-500">Loading assets...</div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {assets.map(asset => (
                        <div key={asset.id} className="group relative bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow">
                            <div className="aspect-square bg-gray-100 dark:bg-gray-900 flex items-center justify-center relative overflow-hidden">
                                {asset.type === 'Image' ? (
                                    <img src={asset.url} alt={asset.title} className="w-full h-full object-cover" />
                                ) : asset.type === 'Video' ? (
                                    <div className="flex flex-col items-center text-gray-400">
                                        <Icon name="VideoCameraIcon" className="w-6 h-6 mb-1" />
                                        <span className="text-[8px]">Video</span>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center text-gray-400">
                                        <Icon name="DocumentTextIcon" className="w-6 h-6 mb-1" />
                                        <span className="text-[8px]">Document</span>
                                    </div>
                                )}
                                
                                {/* Overlay Actions */}
                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button className="p-1.5 bg-white/20 hover:bg-white/40 rounded-full text-white backdrop-blur-sm" title="Preview">
                                        <Icon name="EyeIcon" className="w-3 h-3" />
                                    </button>
                                    <button 
                                        className="p-1.5 bg-red-500/80 hover:bg-red-500 rounded-full text-white backdrop-blur-sm" 
                                        title="Delete"
                                        onClick={() => handleDelete(asset.id)}
                                    >
                                        <Icon name="TrashIcon" className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                            <div className="p-2">
                                <div className="font-bold text-[10px] text-gray-800 dark:text-white truncate" title={asset.title}>{asset.title}</div>
                                <div className="flex justify-between items-center mt-0.5">
                                    <span className="text-[8px] text-gray-500 uppercase font-bold">{asset.type}</span>
                                    <span className="text-[8px] text-gray-400">{formatSize(asset.size)}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                    {assets.length === 0 && (
                        <div className="col-span-full py-6 text-center text-gray-400 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                            <Icon name="PhotoIcon" className="w-8 h-8 mx-auto mb-1 opacity-50" />
                            <p className="text-[10px]">No assets found. Upload some files to get started.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
