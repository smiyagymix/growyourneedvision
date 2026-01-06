
import React, { Suspense, lazy } from 'react';
import MainLayout from './MainLayout';
import { PARENT_CONFIG } from '../../data/AppConfigs';
import { ErrorBoundary } from '../shared/ErrorBoundary';
import { Spinner } from '../shared/ui/Spinner';

const ParentDashboard = lazy(() => import('../../apps/dashboards/ParentDashboard'));
const ParentAcademic = lazy(() => import('../../apps/parent/Academic'));
const ParentFinance = lazy(() => import('../../apps/parent/Finance'));
const ParentCommunication = lazy(() => import('../../apps/parent/Communication'));
const Wellness = lazy(() => import('../../apps/Wellness'));
const Tools = lazy(() => import('../../apps/Tools'));
const ParentConcierge = lazy(() => import('../../apps/parent/ParentConcierge'));
// New components
const Dashboard = lazy(() => import('../../apps/parent/Dashboard'));
const Attendance = lazy(() => import('../../apps/parent/Attendance'));
const Grades = lazy(() => import('../../apps/parent/Grades'));
const Schedule = lazy(() => import('../../apps/parent/Schedule'));

const ParentLayout: React.FC = () => {
  const renderContent = (activeModule: string, activeTab: string, activeSubNav: string) => {
    const props = { activeTab, activeSubNav };
    const content = (() => {
      switch (activeModule) {
        case 'dashboard': return <Dashboard />;
        case 'attendance': return <Attendance />;
        case 'grades': return <Grades />;
        case 'schedule': return <Schedule />;
        case 'academic': return <ParentAcademic {...props} />;
        case 'finance': return <ParentFinance {...props} />;
        case 'communication': return <ParentCommunication {...props} />;
        case 'wellness': return <Wellness {...props} />;
        case 'tools': return <Tools {...props} />;
        case 'concierge': return <ParentConcierge {...props} />;
        default: return (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <h2 className="text-2xl font-bold">Parent {activeModule} Module</h2>
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

  return <MainLayout config={PARENT_CONFIG} renderContent={renderContent} role="Parent" />;
};

export default ParentLayout;
