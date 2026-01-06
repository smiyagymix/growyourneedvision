import React from 'react';
import { Modal, Button, Icon } from '../ui/CommonUI';

interface FilePreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    file: {
        name: string;
        url: string;
        type?: string; // mime type or extension
    } | null;
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({ isOpen, onClose, file }) => {
    if (!file) return null;

    const isImage = (filename: string) => /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(filename);
    const isPDF = (filename: string) => /\.pdf$/i.test(filename);

    const renderContent = () => {
        if (isImage(file.name)) {
            return (
                <div className="flex justify-center items-center bg-gray-100 dark:bg-slate-900 rounded-lg p-4 min-h-[300px]">
                    <img
                        src={file.url}
                        alt={file.name}
                        className="max-w-full max-h-[70vh] object-contain rounded shadow-sm"
                    />
                </div>
            );
        }

        if (isPDF(file.name)) {
            return (
                <div className="w-full h-[70vh] bg-gray-100 dark:bg-slate-900 rounded-lg overflow-hidden">
                    <iframe
                        src={`${file.url}#toolbar=0`}
                        className="w-full h-full border-0"
                        title={file.name}
                    />
                </div>
            );
        }

        return (
            <div className="flex flex-col items-center justify-center h-[300px] text-center p-8 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-gray-200 dark:border-slate-700">
                <Icon name="DocumentTextIcon" className="w-16 h-16 text-gray-300 mb-4" />
                <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-2">Preview Not Available</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md">
                    This file type cannot be previewed directly in the browser. Please download the file to view it.
                </p>
                <Button
                    variant="primary"
                    icon="ArrowDownTrayIcon"
                    onClick={() => window.open(file.url, '_blank')}
                >
                    Download File
                </Button>
            </div>
        );
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={file.name}
            size="xl"
            footer={
                <div className="flex justify-between w-full">
                    <Button variant="ghost" onClick={onClose}>Close</Button>
                    <Button
                        variant="primary"
                        icon="ArrowDownTrayIcon"
                        onClick={() => window.open(file.url, '_blank')}
                    >
                        Download
                    </Button>
                </div>
            }
        >
            {renderContent()}
        </Modal>
    );
};
