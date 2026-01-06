import React from 'react';
import { WidgetErrorBoundary } from '../../components/shared/ui/WidgetErrorBoundary';
import { RoleBasedAIChat } from '../../components/shared/RoleBasedAIChat';

interface Props {
  activeTab: string;
  activeSubNav: string;
}

const SchoolConcierge: React.FC<Props> = ({ activeTab, activeSubNav }) => {
  return (
    <div className="h-full p-6">
      <RoleBasedAIChat 
        role="school_admin" 
        context={`Tab: ${activeTab}, SubNav: ${activeSubNav}`}
        title="School Admin AI"
        subtitle="Manage your institution with AI-driven insights."
      />
    </div>
  );
};

export default SchoolConcierge;
