
import React from 'react';

interface TabsProps {
  tabs: string[];
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onTabChange }) => {
  return (
    <div className="flex gap-2 border-b border-gray-200 mb-6">
      {tabs.map(tab => (
        <button
          type="button"
          key={tab}
          onClick={() => onTabChange(tab)}
          className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors ${
            activeTab === tab 
              ? 'border-gyn-blue-medium text-gyn-blue-dark' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
};
