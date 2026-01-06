
import React, { Suspense, lazy } from 'react';
import MainLayout from './MainLayout';
import { INDIVIDUAL_CONFIG } from '../../data/AppConfigs';
import { ErrorBoundary } from '../shared/ErrorBoundary';
import { Spinner } from '../shared/ui/Spinner';

const IndividualDashboard = lazy(() => import('../../apps/IndividualDashboard'));
const ProjectsApp = lazy(() => import('../../apps/ProjectsApp'));
const IndividualLearning = lazy(() => import('../../apps/individual/Learning'));
const MarketApp = lazy(() => import('../../apps/MarketApp'));
const Wellness = lazy(() => import('../../apps/Wellness'));
const PlatformSettings = lazy(() => import('../../apps/PlatformSettings'));
const Tools = lazy(() => import('../../apps/Tools'));
const ConciergeAI = lazy(() => import('../../apps/ConciergeAI'));
// New components
const Dashboard = lazy(() => import('../../apps/individual/Dashboard'));
const Projects = lazy(() => import('../../apps/individual/Projects'));
const Goals = lazy(() => import('../../apps/individual/Goals'));
const Skills = lazy(() => import('../../apps/individual/Skills'));
const Certifications = lazy(() => import('../../apps/individual/Certifications'));

const IndividualLayout: React.FC = () => {
  const renderContent = (activeModule: string, activeTab: string, activeSubNav: string) => {
    const props = { activeTab, activeSubNav };
    const content = (() => {
      switch (activeModule) {
        case 'dashboard': return <Dashboard />;
        case 'projects': return <Projects />;
        case 'goals': return <Goals />;
        case 'skills': return <Skills />;
        case 'certifications': return <Certifications />;
        case 'learning': return <IndividualLearning {...props} />;
        case 'marketplace': return <MarketApp {...props} />;
        case 'wellness': return <Wellness {...props} />;
        case 'settings': return <PlatformSettings {...props} />;
        case 'tools': return <Tools {...props} />;
        case 'concierge': return <ConciergeAI {...props} />;
        default: return (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <h2 className="text-2xl font-bold">Individual {activeModule} Module</h2>
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

  return <MainLayout config={INDIVIDUAL_CONFIG} renderContent={renderContent} role="Individual" />;
};

export default IndividualLayout;
