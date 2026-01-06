import React from 'react';
import { motion } from 'framer-motion';
import { AuditLog } from '../../../services/ownerService';
import { Icon } from '../../../components/shared/ui/CommonUI';

interface ActivityFeedProps {
    activities: AuditLog[];
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ activities }) => {
    if (!activities || activities.length === 0) {
        return (
            <div className="text-center py-8 text-slate-400 text-sm">
                No recent activity
            </div>
        );
    }

    const getIconForModule = (module: string) => {
        switch (module) {
            case 'Tenants': return 'UserGroup';
            case 'Billing': return 'Banknotes';
            case 'Tickets': return 'Ticket';
            default: return 'Bell';
        }
    };

    const getColorForModule = (module: string) => {
        switch (module) {
            case 'Tenants': return 'bg-blue-50 text-blue-600 border border-blue-100';
            case 'Billing': return 'bg-emerald-50 text-emerald-600 border border-emerald-100';
            case 'Tickets': return 'bg-purple-50 text-purple-600 border border-purple-100';
            default: return 'bg-slate-50 text-slate-600 border border-slate-100';
        }
    };

    return (
        <div className="space-y-4">
            {activities.map((activity, index) => (
                <motion.div 
                    key={activity.id} 
                    className="flex gap-3 items-start group"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                >
                    <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${getColorForModule(activity.module)} transition-transform group-hover:scale-110 shadow-sm`}>
                        <Icon name={getIconForModule(activity.module)} className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-700 truncate group-hover:text-slate-900 transition-colors">
                            {activity.action}
                        </p>
                        <p className="text-xs text-slate-500 truncate group-hover:text-slate-600 transition-colors">
                            {typeof activity.details === 'string' ? activity.details : JSON.stringify(activity.details)}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1">
                            {new Date(activity.created).toLocaleString()}
                        </p>
                    </div>
                </motion.div>
            ))}
        </div>
    );
};
