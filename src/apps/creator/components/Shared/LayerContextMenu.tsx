import React from 'react';
import { ContextMenu } from './ContextMenu';

interface LayerContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onCopy: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onLock: () => void;
  onBringToFront: () => void;
  onSendToBack: () => void;
}

export const LayerContextMenu: React.FC<LayerContextMenuProps> = ({
  x, y, onClose, onCopy, onDelete, onDuplicate, onLock, onBringToFront, onSendToBack
}) => {
  const items = [
    { label: 'Copy', action: onCopy, shortcut: 'Ctrl+C' },
    { label: 'Duplicate', action: onDuplicate, shortcut: 'Ctrl+D' },
    { label: 'Delete', action: onDelete, shortcut: 'Del' },
    { label: 'Lock/Unlock', action: onLock, shortcut: 'Ctrl+L' },
    { label: 'Bring to Front', action: onBringToFront, shortcut: ']' },
    { label: 'Send to Back', action: onSendToBack, shortcut: '[' },
  ];

  return <ContextMenu x={x} y={y} items={items} onClose={onClose} />;
};
