import React from 'react';
import { ContextMenu } from './ContextMenu';

interface CanvasContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onPaste: () => void;
  onSelectAll: () => void;
  onGridToggle: () => void;
}

export const CanvasContextMenu: React.FC<CanvasContextMenuProps> = ({
  x, y, onClose, onPaste, onSelectAll, onGridToggle
}) => {
  const items = [
    { label: 'Paste', action: onPaste, shortcut: 'Ctrl+V' },
    { label: 'Select All', action: onSelectAll, shortcut: 'Ctrl+A' },
    { label: 'Toggle Grid', action: onGridToggle },
  ];

  return <ContextMenu x={x} y={y} items={items} onClose={onClose} />;
};
