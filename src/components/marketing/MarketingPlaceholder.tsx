import React from 'react';
import { Card, Icon, Button } from '../shared/ui/CommonUI';

interface MarketingPlaceholderProps {
    title: string;
    description: string;
    icon: string;
}

export const MarketingPlaceholder: React.FC<MarketingPlaceholderProps> = ({ title, description, icon }) => {
    return (
        <Card className="p-12 flex flex-col items-center justify-center text-center min-h-[400px]">
            <div className="w-24 h-24 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-6">
                <Icon name={icon} className="w-12 h-12 text-blue-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{title}</h2>
            <p className="text-gray-500 max-w-md mb-8">{description}</p>
            <Button variant="primary">
                Configure {title}
            </Button>
            <div className="mt-8 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg max-w-md">
                <p className="text-xs text-yellow-700 dark:text-yellow-400 font-mono">
                    DEV NOTE: This feature is scheduled for Phase 3 Part 2 implementation.
                </p>
            </div>
        </Card>
    );
};
