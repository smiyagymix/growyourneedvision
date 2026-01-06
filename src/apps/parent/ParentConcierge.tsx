import React from 'react';
import { WidgetErrorBoundary } from '../../components/shared/ui/WidgetErrorBoundary';
import { RoleBasedAIChat } from '../../components/shared/RoleBasedAIChat';

interface Props {
  activeTab: string;
  activeSubNav: string;
}

const ParentConcierge: React.FC<Props> = ({ activeTab, activeSubNav }) => {
  return (
    <div className="h-full p-6">
      <RoleBasedAIChat 
        role="parent" 
        context={`Tab: ${activeTab}, SubNav: ${activeSubNav}`}
        title="Parent Assistant"
        subtitle="Get updates on your child's progress and school events."
      />
    </div>
  );
};

export default ParentConcierge;
