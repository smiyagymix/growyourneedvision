import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import pb from '../../lib/pocketbase';
import { Icon } from '../../components/shared/ui/CommonUI';

export const CalendarTool: React.FC = () => {
    const { data: events, isLoading: loadingEvents } = useQuery({
        queryKey: ['events'],
        queryFn: async () => await pb.collection('events').getFullList({ sort: 'start' })
    });

    // Simple state for currently viewed month
    const [currentDate, setCurrentDate] = useState(new Date());

    return (
        <div className="h-full flex flex-col gap-4 animate-fadeIn">
            <div className="flex justify-between items-center">
                <h3 className="text-gray-400 font-bold text-sm">
                    {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </h3>
                <div className="flex gap-2">
                    <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))} className="p-1 hover:bg-[#2a2d3d] rounded">
                        <Icon name="ChevronLeftIcon" className="w-5 h-5" />
                    </button>
                    <button onClick={() => setCurrentDate(new Date())} className="text-xs bg-[#2a2d3d] px-2 py-1 rounded">Today</button>
                    <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))} className="p-1 hover:bg-[#2a2d3d] rounded">
                        <Icon name="ChevronRightIcon" className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="flex-1 bg-[#161825] border border-[#2a2d3d] rounded-lg overflow-hidden flex flex-col">
                {/* Calendar Header */}
                <div className="grid grid-cols-7 border-b border-[#2a2d3d] bg-[#0f111a]">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="py-2 text-center text-xs text-gray-500 font-bold">{day}</div>
                    ))}
                </div>

                {/* Calendar Grid - Simplified rendering */}
                <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
                    <div className="text-center">
                        <Icon name="CalendarIcon" className="w-12 h-12 mx-auto mb-2 opacity-20" />
                        <p>Full Event Calendar Implementation Here</p>
                        <p className="text-xs mt-2 text-emerald-500">Connected to 'events' collection: {events?.length || 0} events loaded.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
