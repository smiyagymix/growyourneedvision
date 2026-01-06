import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Icon, Button } from './ui/CommonUI';

export const ImpersonationBanner: React.FC = () => {
    const { isImpersonating, user, stopImpersonation } = useAuth();

    if (!isImpersonating || !user) return null;

    return (
        <div className="fixed top-0 left-0 right-0 z-[100] bg-gyn-orange text-white px-4 py-2 shadow-md flex items-center justify-between animate-slideDown">
            <div className="flex items-center gap-2">
                <Icon name="EyeIcon" className="w-5 h-5 animate-pulse" />
                <span className="font-bold text-sm">
                    Viewing as: {user.name} ({user.role})
                </span>
            </div>
            <div className="flex items-center gap-4">
                <span className="text-xs opacity-90 hidden sm:inline">
                    Admin Mode Active
                </span>
                <Button
                    variant="secondary"
                    size="sm"
                    onClick={stopImpersonation}
                    className="bg-white text-gyn-orange hover:bg-gray-100 border-none h-8 text-xs font-bold"
                >
                    Stop Impersonating
                </Button>
            </div>
        </div>
    );
};
