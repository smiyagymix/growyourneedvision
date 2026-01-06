
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { OwnerIcon } from '../components/shared/OwnerIcons';
import LandingFooter from '../components/layout/LandingFooter';

const HelpCenterPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      {/* Header */}
      <div className="bg-[#0f172a] py-6 px-6">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
              <div className="flex items-center gap-2 cursor-pointer text-white" onClick={() => navigate('/')}>
                  <OwnerIcon name="HelpIcon3D" className="w-6 h-6" />
                  <span className="font-bold">Help Center</span>
              </div>
              <button className="text-white text-sm font-medium hover:text-blue-300">Submit a Ticket</button>
          </div>
      </div>

      {/* Search Hero */}
      <div className="bg-[#0f172a] pb-24 pt-10 px-6 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-6">How can we assist you today?</h1>
          <div className="max-w-2xl mx-auto relative">
              <input type="text" placeholder="Search for articles, errors, or guides..." className="w-full py-4 pl-12 pr-4 rounded-lg shadow-lg focus:outline-none focus:ring-4 focus:ring-blue-500/50 text-lg" />
              <OwnerIcon name="SearchIcon" className="absolute left-4 top-4.5 w-6 h-6 text-gray-400" />
          </div>
      </div>

      {/* Categories */}
      <div className="max-w-6xl mx-auto px-4 -mt-12 relative z-10 pb-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                  { title: "Account & Billing", icon: "UserIcon", desc: "Invoices, plans, and settings." },
                  { title: "Technical Issues", icon: "WrenchScrewdriver", desc: "Bugs, errors, and outages." },
                  { title: "Getting Started", icon: "RocketLaunchIcon", desc: "Onboarding and setup." },
              ].map((cat, i) => (
                  <div key={i} className="bg-white p-8 rounded-xl shadow-lg border border-gray-100 hover:-translate-y-1 transition-transform cursor-pointer text-center">
                      <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600">
                          <OwnerIcon name={cat.icon} className="w-8 h-8" />
                      </div>
                      <h3 className="font-bold text-xl mb-2">{cat.title}</h3>
                      <p className="text-gray-500">{cat.desc}</p>
                  </div>
              ))}
          </div>

          <div className="mt-16">
              <h2 className="text-2xl font-bold mb-6">Popular Articles</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                      "How to configure a custom domain?",
                      "Resetting your 2FA token",
                      "Understanding API rate limits",
                      "Migrating from Blackboard to Grow Your Need",
                      "Setting up payment gateways",
                      "Inviting team members"
                  ].map((article, i) => (
                      <div key={i} className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors cursor-pointer flex justify-between items-center group">
                          <span className="font-medium text-gray-700 group-hover:text-blue-800">{article}</span>
                          <OwnerIcon name="ChevronRight" className="w-4 h-4 text-gray-400 group-hover:text-blue-500" />
                      </div>
                  ))}
              </div>
          </div>
      </div>

      <div className="bg-gray-50 py-20 px-6 text-center">
          <h2 className="text-2xl font-bold mb-4">Still need help?</h2>
          <p className="text-gray-500 mb-8">Our support team is available 24/7 for Enterprise customers.</p>
          <button className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold shadow-md hover:bg-blue-700 transition-colors">Contact Support</button>
      </div>

      <LandingFooter />
    </div>
  );
};

export default HelpCenterPage;
    