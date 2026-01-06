import React from 'react';
import { motion } from 'framer-motion';
import { OwnerIcon } from '../../../components/shared/OwnerIcons';
import { SystemAlert } from '../../../services/ownerService';

interface AlertListProps {
    alerts: SystemAlert[];
}

export const AlertList: React.FC<AlertListProps> = ({ alerts }) => {
    const getSeverityStyles = (severity: string) => {
        switch (severity) {
            case 'critical': return 'bg-rose-50 border-rose-100 text-rose-700';
            case 'warning': return 'bg-amber-50 border-amber-100 text-amber-700';
            case 'info': return 'bg-blue-50 border-blue-100 text-blue-700';
            default: return 'bg-slate-50 border-slate-100 text-slate-700';
        }
    };

    const getIcon = (severity: string) => {
        switch (severity) {
            case 'critical': return 'ExclamationCircle';
            case 'warning': return 'ExclamationTriangle';
            case 'info': return 'InformationCircle';
            default: return 'Bell';
        }
    };

    return (
        <div className="space-y-3">
            {alerts.map((alert, index) => (
                <motion.div 
                    key={alert.id} 
                    className={`p-3 rounded-xl border flex items-start gap-3 ${getSeverityStyles(alert.severity)} backdrop-blur-sm shadow-sm`}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                >
                    <OwnerIcon name={getIcon(alert.severity)} className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm truncate">{alert.message}</p>
                        <p className="text-[10px] opacity-70 mt-1">
                            {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                    </div>
                    {alert.actionUrl && (
                        <button className="text-xs font-bold underline hover:opacity-80 whitespace-nowrap">
                            View
                        </button>
                    )}
                </motion.div>
            ))}
        </div>
    );
};
