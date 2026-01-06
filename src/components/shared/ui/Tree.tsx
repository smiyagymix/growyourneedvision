import React, { useState } from 'react';
import { OwnerIcon } from '../OwnerIcons';

interface TreeNode {
  id: string;
  label: string;
  type: 'folder' | 'file';
  children?: TreeNode[];
}

interface TreeProps {
  data: TreeNode[];
}

const TreeNodeItem: React.FC<{ node: TreeNode; level: number }> = ({ node, level }) => {
  const [isOpen, setIsOpen] = useState(false);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className="select-none">
      <div 
        className="flex items-center gap-2 py-1 px-2 hover:bg-gray-100 rounded cursor-pointer transition-colors text-sm text-gray-700"
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        onClick={() => hasChildren && setIsOpen(!isOpen)}
      >
        {node.type === 'folder' && (
            <OwnerIcon name="ChevronRight" className={`w-3 h-3 text-gray-400 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
        )}
        <OwnerIcon name={node.type === 'folder' ? 'Folder' : 'DocumentTextIcon'} className={`w-4 h-4 ${node.type === 'folder' ? 'text-blue-400' : 'text-gray-500'}`} />
        <span>{node.label}</span>
      </div>
      {isOpen && hasChildren && (
        <div>
          {node.children!.map(child => (
            <TreeNodeItem key={child.id} node={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

export const Tree: React.FC<TreeProps> = ({ data }) => {
  return (
    <div className="border border-gray-200 rounded-xl p-2 bg-white h-full overflow-y-auto">
      {data.map(node => (
        <TreeNodeItem key={node.id} node={node} level={0} />
      ))}
    </div>
  );
};