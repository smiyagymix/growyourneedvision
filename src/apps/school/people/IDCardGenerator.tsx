import React, { useRef } from 'react';
import { WidgetErrorBoundary } from '../../../components/shared/ui/WidgetErrorBoundary';
import { User } from '../../../context/AuthContext';
import { Modal } from '../../../components/shared/ui/CommonUI';
import { Button } from '../../../components/shared/ui/Button';
import { useReactToPrint } from 'react-to-print';

interface IDCardGeneratorProps {
    user: User | null;
    isOpen: boolean;
    onClose: () => void;
    schoolName?: string;
}

export const IDCardGenerator: React.FC<IDCardGeneratorProps> = ({ user, isOpen, onClose, schoolName = "Grow Your Need Academy" }) => {
    const componentRef = useRef<HTMLDivElement>(null);

    const handlePrint = useReactToPrint({
        contentRef: componentRef,
    });

    if (!user) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Generate ID Card" size="lg">
            <div className="flex flex-col items-center space-y-6">
                {/* ID Card Preview */}
                <div ref={componentRef} className="w-[350px] h-[220px] bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden relative print:shadow-none print:border-black">
                    {/* Background Pattern */}
                    <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-blue-600 to-indigo-700"></div>
                    
                    <div className="relative z-10 flex flex-col items-center mt-8">
                        <div className="w-24 h-24 rounded-full border-4 border-white bg-gray-200 overflow-hidden shadow-md">
                            {user.avatar ? (
                                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-indigo-100 text-indigo-600 text-2xl font-bold">
                                    {user.name.substring(0, 2).toUpperCase()}
                                </div>
                            )}
                        </div>
                        
                        <div className="text-center mt-2">
                            <h3 className="text-lg font-bold text-gray-900">{user.name}</h3>
                            <p className="text-sm text-indigo-600 font-medium uppercase tracking-wider">{user.role}</p>
                        </div>
                    </div>

                    <div className="absolute bottom-4 left-4">
                        <p className="text-xs text-gray-500">ID: {user.id.substring(0, 8).toUpperCase()}</p>
                    </div>

                    <div className="absolute bottom-4 right-4">
                        <div className="text-right">
                            <p className="text-[10px] text-gray-400 font-bold uppercase">{schoolName}</p>
                            <p className="text-[8px] text-gray-400">2025-2026</p>
                        </div>
                    </div>
                </div>

                <div className="flex gap-4 w-full justify-end pt-4 border-t border-gray-100">
                    <Button variant="ghost" onClick={onClose}>Close</Button>
                    <Button variant="primary" onClick={handlePrint}>Print ID Card</Button>
                </div>
            </div>
        </Modal>
    );
};
