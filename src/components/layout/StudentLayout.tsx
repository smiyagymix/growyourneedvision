import React, { Suspense, lazy } from 'react';
import MainLayout from './MainLayout';
import { STUDENT_CONFIG } from '../../data/AppConfigs';
import { ErrorBoundary } from '../shared/ErrorBoundary';
import { Spinner } from '../shared/ui/Spinner';

const StudentCourses = lazy(() => import('../../apps/student/Courses'));
const StudentAssignments = lazy(() => import('../../apps/student/Assignments'));
const ActivitiesApp = lazy(() => import('../../apps/ActivitiesApp'));
const Wellness = lazy(() => import('../../apps/Wellness'));
const Tools = lazy(() => import('../../apps/Tools'));
const StudentConcierge = lazy(() => import('../../apps/student/StudentConcierge'));
// New components
const Dashboard = lazy(() => import('../../apps/student/Dashboard'));
const ResourceLibrary = lazy(() => import('../../apps/student/ResourceLibrary'));

const StudentLayout: React.FC = () => {
    const renderContent = (activeModule: string, activeTab: string, activeSubNav: string) => {
        console.log('StudentLayout renderContent:', activeModule, activeTab);
        const props = { activeTab, activeSubNav };

        const content = (() => {
            switch (activeModule) {
                case 'dashboard': return <Dashboard />;
                case 'courses': return <StudentCourses {...props} />;
                case 'assignments': return <StudentAssignments {...props} />;
                case 'resources': return <ResourceLibrary />;
                case 'activities': return <ActivitiesApp {...props} />;
                case 'wellness': return <Wellness {...props} />;
                case 'tools': return <Tools {...props} />;
                case 'concierge_ai': return <StudentConcierge {...props} />;
                default: return (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                        <h2 className="text-2xl font-bold">Student {activeModule} Module</h2>
                        <p>Under Development for {activeTab}</p>
                    </div>
                );
            }
        })();

        return (
            <ErrorBoundary>
                <Suspense fallback={<div className="flex items-center justify-center h-full"><Spinner /></div>}>
                    {content}
                </Suspense>
            </ErrorBoundary>
        );
    };

    return (
        <div className="flex flex-col h-full">
            <div className="px-4 pt-3 text-xl font-bold text-gray-900 dark:text-white" data-testid="welcome-msg">
                Welcome back, Alex Student
            </div>
            <MainLayout config={STUDENT_CONFIG} renderContent={renderContent} role="Student" />
        </div>
    );
};

export default StudentLayout;
