import { useState, useEffect, useCallback } from 'react';
import pb from '../lib/pocketbase';
import { FileNode } from '../components/shared/ui/FileTree';

// Extended interface for PocketBase
export interface StorageItem {
    id: string;
    collectionId: string;
    collectionName: string;
    created: string;
    updated: string;
    name: string;
    type: 'file' | 'folder';
    parent?: string; // ID of parent folder
    owner: string;
    size?: number;
    blob?: string; // Filename in PB
}

export const useFileStorage = () => {
    const [files, setFiles] = useState<FileNode[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPath, setCurrentPath] = useState<string[]>([]); // For navigation breadcrumbs if needed

    // Convert flat list from PB to Tree structure
    const buildTree = (items: StorageItem[], parentId: string | null = null): FileNode[] => {
        return items
            .filter(item => (parentId ? item.parent === parentId : !item.parent))
            .map(item => ({
                id: item.id,
                name: item.name,
                type: item.type,
                size: item.size,
                children: item.type === 'folder' ? buildTree(items, item.id) : undefined
            }));
    };

    const fetchFiles = useCallback(async () => {
        setLoading(true);
        try {
            // Try to fetch from real backend
            const records = await pb.collection('storage_files').getFullList<StorageItem>({
                sort: '-created',
            });
            
            const tree = buildTree(records);
            setFiles(tree);
            setError(null);
        } catch (err: any) {
            console.error('Failed to fetch storage_files:', err.message);
            setError(err.message);
            setFiles([]);
        } finally {
            setLoading(false);
        }
    }, []);

    const createFolder = async (name: string, parentId?: string) => {
        try {
            if (!pb.authStore.isValid) throw new Error("User not authenticated");
            
            await pb.collection('storage_files').create({
                name,
                type: 'folder',
                parent: parentId,
                owner: pb.authStore.model?.id
            });
            await fetchFiles();
            return true;
        } catch (err: any) {
            console.error('Error creating folder:', err);
            setError(err.message);
            return false;
        }
    };

    const uploadFile = async (file: File, parentId?: string) => {
        try {
            if (!pb.authStore.isValid) throw new Error("User not authenticated");

            const formData = new FormData();
            formData.append('name', file.name);
            formData.append('type', 'file');
            formData.append('size', file.size.toString());
            if (parentId) formData.append('parent', parentId);
            formData.append('owner', pb.authStore.model?.id || '');
            formData.append('blob', file);

            await pb.collection('storage_files').create(formData);
            await fetchFiles();
            return true;
        } catch (err: any) {
            console.error('Error uploading file:', err);
            setError(err.message);
            return false;
        }
    };

    const deleteItem = async (id: string) => {
        try {
            if (!pb.authStore.isValid) throw new Error("User not authenticated");

            const role = pb.authStore.model?.role;
            // Role-based access control (RBAC)
            if (role !== 'Owner' && role !== 'Admin') {
                 throw new Error("Permission denied: Only Owners and Admins can delete files.");
            }

            await pb.collection('storage_files').delete(id);
            await fetchFiles();
            return true;
        } catch (err: any) {
            console.error('Error deleting item:', err);
            setError(err.message);
            return false;
        }
    };

    // Initial fetch
    useEffect(() => {
        fetchFiles();
        
        // Real-time subscription
        let unsubscribe: () => void;
        pb.collection('storage_files').subscribe('*', (e) => {
            if (e.action === 'create' || e.action === 'update' || e.action === 'delete') {
                fetchFiles();
            }
        }).then(unsub => unsubscribe = unsub).catch(() => {});

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [fetchFiles]);

    return {
        files,
        loading,
        error,
        createFolder,
        uploadFile,
        deleteItem,
        refresh: fetchFiles
    };
};
