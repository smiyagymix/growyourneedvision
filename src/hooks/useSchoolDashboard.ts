import { useState, useEffect } from 'react';
import { schoolService, SchoolActivity, ChartDataPoint } from '../services/schoolService';
import { useSchool } from '../apps/school/SchoolContext';

export const useSchoolDashboard = () => {
    const { stats, loading: contextLoading } = useSchool();
    const [activities, setActivities] = useState<SchoolActivity[]>([]);
    const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadDashboardData = async () => {
            setLoading(true);
            try {
                const [recentActivity, growthData] = await Promise.all([
                    schoolService.getRecentActivity(),
                    schoolService.getGrowthChartData()
                ]);
                setActivities(recentActivity);
                setChartData(growthData);
            } catch (error) {
                console.error("Error loading school dashboard:", error);
            } finally {
                setLoading(false);
            }
        };

        loadDashboardData();
    }, []);

    return {
        stats,
        activities,
        chartData,
        loading: loading || contextLoading
    };
};
