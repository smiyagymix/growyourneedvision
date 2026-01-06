
import React, { Suspense, lazy } from 'react';
import MainLayout from './MainLayout';
import { SCHOOL_ADMIN_CONFIG } from '../../data/AppConfigs';
import { ErrorBoundary } from '../shared/ErrorBoundary';
import { Spinner } from '../shared/ui/Spinner';

const SchoolAdminDashboard = lazy(() => import('../../apps/dashboards/SchoolAdminDashboard'));
const SchoolCRM = lazy(() => import('../../apps/school/crm/SchoolCRM'));
const Academics = lazy(() => import('../../apps/school/Academics'));
const Enrollment = lazy(() => import('../../apps/school/Enrollment'));
const People = lazy(() => import('../../apps/school/People'));
const Finance = lazy(() => import('../../apps/school/Finance'));
const Attendance = lazy(() => import('../../apps/school/Attendance'));
const Grades = lazy(() => import('../../apps/school/Grades'));
const Services = lazy(() => import('../../apps/school/Services'));
const Communication = lazy(() => import('../../apps/Communication'));
const Wellness = lazy(() => import('../../apps/Wellness'));
const PlatformSettings = lazy(() => import('../../apps/PlatformSettings'));
const Tools = lazy(() => import('../../apps/Tools'));
const SchoolConcierge = lazy(() => import('../../apps/school/SchoolConcierge'));

const AdminSchoolLayout: React.FC = () => {
  const renderContent = (activeModule: string, activeTab: string, activeSubNav: string) => {
    const props = { activeTab, activeSubNav };
    const content = (() => {
      switch (activeModule) {
        case 'dashboard': return <SchoolAdminDashboard {...props} />;
        case 'crm': return <SchoolCRM {...props} />;
        case 'academics': return <Academics {...props} />;
        case 'enrollment': return <Enrollment />;
        case 'people': return <People {...props} />;
        case 'finance': return <Finance {...props} />;
        case 'attendance': return <Attendance {...props} />;
        case 'grades': return <Grades {...props} />;
        case 'services': return <Services {...props} />;
        case 'communication': return <Communication {...props} />;
        case 'wellness': return <Wellness {...props} />;
        case 'settings': return <PlatformSettings {...props} />;
        case 'tools': return <Tools {...props} />;
        case 'concierge_ai': return <SchoolConcierge {...props} />;
        default: return <div>Not Found</div>;
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

  return <MainLayout config={SCHOOL_ADMIN_CONFIG} renderContent={renderContent} role="School Admin" />;
};

export default AdminSchoolLayout;
// Re-eval
