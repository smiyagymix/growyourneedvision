import React from 'react';
import { Modal, Button, Icon } from './ui/CommonUI';

interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    variant?: 'danger' | 'warning' | 'info';
    confirmText?: string;
    cancelText?: string;
    loading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    variant = 'danger',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    loading = false
}) => {
    const getVariantConfig = () => {
        switch (variant) {
            case 'danger':
                return {
                    iconName: 'ExclamationTriangleIcon',
                    iconBg: 'bg-red-100',
                    iconColor: 'text-red-600',
                    buttonVariant: 'danger' as const
                };
            case 'warning':
                return {
                    iconName: 'ExclamationCircleIcon',
                    iconBg: 'bg-yellow-100',
                    iconColor: 'text-yellow-600',
                    buttonVariant: 'secondary' as const
                };
            case 'info':
            default:
                return {
                    iconName: 'InformationCircleIcon',
                    iconBg: 'bg-blue-100',
                    iconColor: 'text-blue-600',
                    buttonVariant: 'primary' as const
                };
        }
    };

    const config = getVariantConfig();

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="">
            <div className="space-y-4">
                <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-full ${config.iconBg} flex items-center justify-center shrink-0`}>
                        <Icon name={config.iconName as any} className={`w-6 h-6 ${config.iconColor}`} />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
                        <p className="text-sm text-gray-600 dark:text-slate-400">{message}</p>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-slate-700">
                    <Button variant="ghost" onClick={onClose} disabled={loading}>
                        {cancelText}
                    </Button>
                    <Button
                        variant={config.buttonVariant}
                        onClick={onConfirm}
                        disabled={loading}
                    >
                        {loading ? 'Processing...' : confirmText}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};
