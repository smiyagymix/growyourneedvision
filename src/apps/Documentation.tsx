
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon, Card } from '../components/shared/ui/CommonUI';
import LandingFooter from '../components/layout/LandingFooter';

const Documentation: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 text-gray-900 dark:text-white font-sans flex flex-col animate-fadeIn">
      <header className="h-16 border-b border-gray-200 dark:border-slate-700 flex items-center px-6 sticky top-0 bg-white dark:bg-slate-900 z-50">
          <div className="flex items-center gap-3 w-64 cursor-pointer" onClick={() => navigate('/')}>
              <Icon name="BookOpenIcon" className="w-6 h-6 text-gyn-blue-dark dark:text-blue-400" />
              <span className="font-bold text-lg">Docs</span>
          </div>
          <div className="flex-1 max-w-2xl">
              <div className="relative">
                  <Icon name="SearchIcon" className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  <input type="text" placeholder="Search documentation..." className="w-full bg-gray-100 dark:bg-slate-800 border-none rounded-lg py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-blue-500 dark:text-white placeholder-gray-500" />
              </div>
          </div>
      </header>

      <div className="flex-1 flex max-w-7xl mx-auto w-full">
          {/* Sidebar */}
          <aside className="w-64 border-r border-gray-200 dark:border-slate-700 py-8 hidden md:block shrink-0 h-[calc(100vh-64px)] sticky top-16 overflow-y-auto">
              <div className="space-y-8 px-4">
                  <div>
                      <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Getting Started</h4>
                      <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                          <li className="font-bold text-blue-600 dark:text-blue-400 border-l-2 border-blue-600 dark:border-blue-400 pl-3">Introduction</li>
                          <li className="hover:text-blue-600 dark:hover:text-blue-400 pl-3.5 cursor-pointer transition-colors">Installation</li>
                          <li className="hover:text-blue-600 dark:hover:text-blue-400 pl-3.5 cursor-pointer transition-colors">Architecture</li>
                      </ul>
                  </div>
                  <div>
                      <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Core Modules</h4>
                      <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                          <li className="hover:text-blue-600 dark:hover:text-blue-400 pl-3.5 cursor-pointer transition-colors">School Management</li>
                          <li className="hover:text-blue-600 dark:hover:text-blue-400 pl-3.5 cursor-pointer transition-colors">CRM & Billing</li>
                          <li className="hover:text-blue-600 dark:hover:text-blue-400 pl-3.5 cursor-pointer transition-colors">Creator Studio</li>
                      </ul>
                  </div>
              </div>
          </aside>

          {/* Content */}
          <main className="flex-1 py-12 px-8 md:px-12">
              <div className="prose dark:prose-invert max-w-none">
                  <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-6">Introduction to Grow Your Need OS</h1>
                  <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
                      Grow Your Need is a unified operating system designed to bridge the gap between educational administration, enterprise resource planning, and creative development.
                  </p>
                  
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl p-6 mb-8">
                      <h3 className="text-blue-800 dark:text-blue-300 font-bold text-lg mb-2 flex items-center gap-2"><Icon name="Sparkles" className="w-5 h-5" /> Quick Start</h3>
                      <p className="text-blue-700 dark:text-blue-200 text-sm">
                          Ready to dive in? Check out the <span className="underline cursor-pointer font-bold">Installation Guide</span> to set up your first instance.
                      </p>
                  </div>

                  <h2 className="text-2xl font-bold text-gray-800 dark:text-white mt-10 mb-4">Core Concepts</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 not-prose">
                      <Card className="p-6 hover:border-blue-300 dark:hover:border-blue-500 transition-colors cursor-pointer">
                          <Icon name="UserGroup" className="w-8 h-8 text-gray-400 dark:text-gray-500 mb-3" />
                          <h3 className="font-bold text-gray-900 dark:text-white">Tenants & Users</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Understanding the hierarchy of schools, admins, and students.</p>
                      </Card>
                      <Card className="p-6 hover:border-blue-300 dark:hover:border-blue-500 transition-colors cursor-pointer">
                          <Icon name="CogIcon" className="w-8 h-8 text-gray-400 dark:text-gray-500 mb-3" />
                          <h3 className="font-bold text-gray-900 dark:text-white">Permissions</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Configuring role-based access control (RBAC).</p>
                      </Card>
                  </div>
              </div>
          </main>
      </div>
      <LandingFooter />
    </div>
  );
};

export default Documentation;    