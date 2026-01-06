import React, { useState } from 'react';
import { Icon } from './CommonUI';

export interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  size?: number;
  children?: FileNode[];
}

interface FileTreeNodeProps {
  node: FileNode;
  depth: number;
  onDelete?: (id: string) => void;
}

const FileTreeNode: React.FC<FileTreeNodeProps> = ({ node, depth, onDelete }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <div 
        className="group flex items-center justify-between hover:bg-gray-800 py-1 px-2 cursor-pointer text-gray-400 hover:text-white text-sm pr-4"
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        onClick={() => node.type === 'folder' && setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2 overflow-hidden">
            <Icon 
                name={node.type === 'folder' ? (isOpen ? 'FolderOpenIcon' : 'FolderIcon') : 'DocumentTextIcon'} 
                className="w-4 h-4 shrink-0" 
            />
            <span className="truncate">{node.name}</span>
            {node.size && <span className="text-[10px] text-gray-600 ml-2">{(node.size / 1024).toFixed(1)} KB</span>}
        </div>
        
        {onDelete && (
            <button 
                type="button"
                onClick={(e) => { e.stopPropagation(); onDelete(node.id); }}
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 hover:text-red-500 rounded transition-all"
                title="Delete"
            >
                <Icon name="TrashIcon" className="w-3 h-3" />
            </button>
        )}
      </div>
      {isOpen && node.children && (
        <div>
          {node.children.map(child => (
            <FileTreeNode key={child.id} node={child} depth={depth + 1} onDelete={onDelete} />
          ))}
        </div>
      )}
    </div>
  );
};

export const FileTree: React.FC<{ data: FileNode[]; onDelete?: (id: string) => void }> = ({ data, onDelete }) => {
  return (
    <div className="bg-[#252526] h-full overflow-y-auto py-2 select-none">
      {data.map(node => (
        <FileTreeNode key={node.id} node={node} depth={0} onDelete={onDelete} />
      ))}
    </div>
  );
};