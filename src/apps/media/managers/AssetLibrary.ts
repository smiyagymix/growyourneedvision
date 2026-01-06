export interface Asset {
    id: string;
    type: 'image' | 'video' | 'audio' | 'logo';
    name: string;
    url: string;
    size: number;
    dimensions?: { width: number; height: number };
    duration?: number;
    tags: string[];
    uploadedAt: Date;
    usageCount: number;
}

export interface AssetFolder {
    id: string;
    name: string;
    assetIds: string[];
}

export class AssetLibrary {
    private assets: Map<string, Asset> = new Map();
    private folders: Map<string, AssetFolder> = new Map();

    addAsset(asset: Omit<Asset, 'id' | 'uploadedAt' | 'usageCount'>): Asset {
        const newAsset: Asset = {
            ...asset,
            id: `asset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            uploadedAt: new Date(),
            usageCount: 0,
        };

        this.assets.set(newAsset.id, newAsset);
        return newAsset;
    }

    getAsset(id: string): Asset | null {
        return this.assets.get(id) || null;
    }

    getAllAssets(): Asset[] {
        return Array.from(this.assets.values());
    }

    searchAssets(query: string, type?: Asset['type']): Asset[] {
        const lowerQuery = query.toLowerCase();
        return this.getAllAssets().filter(asset => {
            const matchesQuery = asset.name.toLowerCase().includes(lowerQuery) ||
                asset.tags.some(tag => tag.toLowerCase().includes(lowerQuery));
            const matchesType = !type || asset.type === type;
            return matchesQuery && matchesType;
        });
    }

    getAssetsByType(type: Asset['type']): Asset[] {
        return this.getAllAssets().filter(asset => asset.type === type);
    }

    getAssetsByTag(tag: string): Asset[] {
        return this.getAllAssets().filter(asset => asset.tags.includes(tag));
    }

    removeAsset(id: string): boolean {
        return this.assets.delete(id);
    }

    updateAsset(id: string, updates: Partial<Omit<Asset, 'id' | 'uploadedAt'>>): Asset | null {
        const asset = this.assets.get(id);
        if (!asset) return null;

        const updated = { ...asset, ...updates };
        this.assets.set(id, updated);
        return updated;
    }

    incrementUsage(id: string): void {
        const asset = this.assets.get(id);
        if (asset) {
            asset.usageCount++;
        }
    }

    createFolder(name: string): AssetFolder {
        const folder: AssetFolder = {
            id: `folder-${Date.now()}`,
            name,
            assetIds: [],
        };

        this.folders.set(folder.id, folder);
        return folder;
    }

    addToFolder(folderId: string, assetId: string): boolean {
        const folder = this.folders.get(folderId);
        if (!folder || !this.assets.has(assetId)) return false;

        if (!folder.assetIds.includes(assetId)) {
            folder.assetIds.push(assetId);
        }
        return true;
    }

    getFolder(id: string): AssetFolder | null {
        return this.folders.get(id) || null;
    }

    getFolderAssets(folderId: string): Asset[] {
        const folder = this.folders.get(folderId);
        if (!folder) return [];

        return folder.assetIds
            .map(id => this.assets.get(id))
            .filter((asset): asset is Asset => asset !== undefined);
    }

    getMostUsedAssets(limit: number = 10): Asset[] {
        return this.getAllAssets()
            .sort((a, b) => b.usageCount - a.usageCount)
            .slice(0, limit);
    }

    getRecentAssets(limit: number = 10): Asset[] {
        return this.getAllAssets()
            .sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime())
            .slice(0, limit);
    }
}

export const assetLibrary = new AssetLibrary();
