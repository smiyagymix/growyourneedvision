
import React, { Suspense, lazy } from 'react';
import MainLayout from './MainLayout';
import { TEACHER_CONFIG } from '../../data/AppConfigs';
import { ErrorBoundary } from '../shared/ErrorBoundary';
import { Spinner } from '../shared/ui/Spinner';

const TeacherClasses = lazy(() => import('../../apps/teacher/Classes'));
const TeacherAssignments = lazy(() => import('../../apps/teacher/Assignments'));
const TeacherResources = lazy(() => import('../../apps/teacher/Resources'));
const TeacherCommunication = lazy(() => import('../../apps/teacher/Communication'));
const Wellness = lazy(() => import('../../apps/Wellness'));
const Tools = lazy(() => import('../../apps/Tools'));
const TeacherConcierge = lazy(() => import('../../apps/teacher/TeacherConcierge'));
// New components
const AttendanceMarking = lazy(() => import('../../apps/teacher/AttendanceMarking'));
const LessonPlanner = lazy(() => import('../../apps/teacher/LessonPlanner'));

const TeacherLayout: React.FC = () => {
  const renderContent = (activeModule: string, activeTab: string, activeSubNav: string) => {
    const props = { activeTab, activeSubNav };
    const content = (() => {
      switch (activeModule) {
        case 'dashboard': return <AttendanceMarking />; // Using AttendanceMarking as default dashboard
        case 'attendance': return <AttendanceMarking />;
        case 'lessons': return <LessonPlanner />;
        case 'classes': return <TeacherClasses {...props} />;
        case 'assignments': return <TeacherAssignments {...props} />;
        case 'resources': return <TeacherResources {...props} />;
        case 'communication': return <TeacherCommunication {...props} />;
        case 'wellness': return <Wellness {...props} />;
        case 'tools': return <Tools {...props} />;
        case 'concierge': return <TeacherConcierge {...props} />;
        default: return (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <h2 className="text-2xl font-bold">Teacher {activeModule} Module</h2>
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
      <div className="px-4 pt-3 text-xl font-bold text-gray-900 dark:text-white" data-testid="teacher-welcome-banner">
        Welcome back, Sarah Smith
      </div>
      <MainLayout config={TEACHER_CONFIG} renderContent={renderContent} role="Teacher" />
    </div>
  );
};

export default TeacherLayout;
