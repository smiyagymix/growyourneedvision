
import React from 'react';
import { WidgetErrorBoundary } from '../../../components/shared/ui/WidgetErrorBoundary';
import AdmissionsPipeline from './AdmissionsPipeline';
import { AdmissionInquiries } from './AdmissionInquiries';
import { CommunicationHistory } from './CommunicationHistory';
import { CrmAnalytics } from './CrmAnalytics';
import { OwnerIcon } from '../../../components/shared/OwnerIcons';

interface SchoolCRMProps {
  activeTab: string;
  activeSubNav: string;
}

const SchoolCRM: React.FC<SchoolCRMProps> = ({ activeTab, activeSubNav }) => {
  
  const renderContent = () => {
      if (activeTab === 'Admissions') {
          if (activeSubNav === 'Pipeline') return <AdmissionsPipeline />;
          if (activeSubNav === 'Inquiries') return <AdmissionInquiries />;
          if (activeSubNav === 'Applications') return <AdmissionInquiries />; // Reuse list for now
          return <CrmAnalytics />;
      }
      if (activeTab === 'Relations') {
          return <CommunicationHistory />;
      }
      return (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <OwnerIcon name="UserGroup" className="w-16 h-16 mb-4 opacity-20" />
              <h2 className="text-xl font-bold">Alumni Management</h2>
              <p>Directory and donation tracking module.</p>
          </div>
      );
  };

  return (
    <div className="h-full flex flex-col animate-fadeIn">
       <div className="mb-6">
           <h1 className="text-3xl font-black text-gyn-blue-dark">School Relations</h1>
           <p className="text-gray-500 mt-1">Manage admissions, student interactions, and community engagement.</p>
       </div>
       
       <div className="flex-1 bg-white/50 backdrop-blur-sm rounded-2xl border border-white/60 shadow-sm p-6 overflow-hidden">
           {renderContent()}
       </div>
    </div>
  );
};

export default SchoolCRM;
