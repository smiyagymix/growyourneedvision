import React from 'react';
import { OwnerIcon } from '../components/shared/OwnerIcons';

interface AppSettingsProps {
  activeTab: string;
  activeSubNav: string;
}

const AppSettings: React.FC<AppSettingsProps> = ({ activeTab, activeSubNav }) => {
  return (
    <div className="max-w-5xl mx-auto py-8">
      <h1 className="text-2xl font-black text-gyn-blue-dark mb-6">Global Settings</h1>
      
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex min-h-[500px]">
          {/* Settings List */}
          <div className="w-1/3 border-r border-gray-100 bg-gray-50 p-4">
              <div className="text-xs font-bold text-gray-400 uppercase mb-3 px-2">{activeTab} Configuration</div>
              <div className="space-y-1">
                  {[1, 2, 3, 4, 5].map(i => (
                      <button key={i} className={`w-full text-left px-3 py-2 rounded-lg text-sm ${i === 1 ? 'bg-white shadow-sm font-bold text-gyn-blue-dark' : 'text-gray-600 hover:bg-gray-100'}`}>
                          {activeSubNav} Option {i}
                      </button>
                  ))}
              </div>
          </div>

          {/* Settings Detail */}
          <div className="flex-1 p-8">
              <h2 className="text-xl font-bold text-gyn-blue-dark mb-6 flex items-center gap-2">
                  <OwnerIcon name="Cog6ToothIcon" className="w-6 h-6 text-gray-400" />
                  {activeSubNav} Configuration
              </h2>
              
              <div className="space-y-6">
                  <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                      <input type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none" defaultValue="System Default" />
                  </div>
                  
                  <div className="flex items-center justify-between py-4 border-t border-gray-100">
                      <div>
                          <div className="font-medium text-gray-900">Enable Advanced Features</div>
                          <div className="text-sm text-gray-500">Allow access to beta capabilities.</div>
                      </div>
                      <div className="w-11 h-6 bg-gray-200 rounded-full relative cursor-pointer"><div className="w-5 h-5 bg-white rounded-full absolute top-0.5 left-0.5 shadow-sm"></div></div>
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
};

export default AppSettings;