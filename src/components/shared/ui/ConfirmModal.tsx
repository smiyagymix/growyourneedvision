
import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { OwnerIcon } from '../OwnerIcons';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  confirmVariant?: 'primary' | 'secondary' | 'outline'; 
  danger?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({ 
    isOpen, onClose, onConfirm, title, message, 
    confirmLabel = 'Confirm', confirmVariant = 'primary', danger = false 
}) => {
  return (
    <Modal 
        isOpen={isOpen} 
        onClose={onClose} 
        title={title}
        footer={
            <>
                <Button variant="ghost" onClick={onClose}>Cancel</Button>
                <Button 
                    variant={danger ? 'primary' : confirmVariant} 
                    className={danger ? 'bg-red-600 hover:bg-red-700' : ''}
                    onClick={() => { onConfirm(); onClose(); }}
                >
                    {confirmLabel}
                </Button>
            </>
        }
    >
        <div className="flex gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${danger ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                <OwnerIcon name={danger ? 'ExclamationTriangleIcon' : 'Bell'} className="w-6 h-6" />
            </div>
            <div>
                <p className="text-sm text-gray-600 leading-relaxed">{message}</p>
            </div>
        </div>
    </Modal>
  );
};
