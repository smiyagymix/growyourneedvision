
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../components/shared/ui/CommonUI';
import LandingFooter from '../components/layout/LandingFooter';

const StatusPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans animate-fadeIn">
      <header className="bg-gray-800 py-6 px-6 border-b border-gray-700">
          <div className="max-w-5xl mx-auto flex justify-between items-center">
              <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
                  <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                      <Icon name="ServerStackIcon" className="w-5 h-5 text-black" />
                  </div>
                  <span className="font-bold text-xl">System Status</span>
              </div>
              <button className="bg-white text-black px-4 py-2 rounded text-sm font-bold hover:bg-gray-200 transition-colors">Subscribe to Updates</button>
          </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
          {/* Big Status Banner */}
          <div className="bg-white text-black rounded-lg p-6 mb-12 flex items-center justify-between shadow-lg border-l-4 border-green-600">
              <div className="flex items-center gap-4">
                  <Icon name="CheckCircleIcon" className="w-10 h-10 text-green-600" />
                  <span className="text-2xl font-bold">All Systems Operational</span>
              </div>
              <span className="text-sm font-mono opacity-80 text-gray-500">Last updated: Just now</span>
          </div>

          {/* Components Grid */}
          <div className="bg-white text-black rounded-lg p-6 mb-16 shadow-lg">
              <h2 className="text-xl font-bold border-b border-gray-200 pb-4 mb-4">Platform Components</h2>
              <div className="space-y-2">
              {[
                  "API Gateway (North America)",
                  "API Gateway (Europe)",
                  "Database Clusters",
                  "CDN / Assets",
                  "Concierge AI Model Inference",
                  "Authentication Services"
              ].map((service, i) => (
                  <div key={i} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                      <span className="font-medium text-gray-800">{service}</span>
                      <span className="text-green-600 text-sm font-bold flex items-center gap-2">
                          Operational <Icon name="CheckCircleIcon" className="w-4 h-4" />
                      </span>
                  </div>
              ))}
              </div>
          </div>

          {/* Metric Graphs (Simulated) */}
          <div className="space-y-8">
              <h2 className="text-xl font-bold border-b border-gray-700 pb-4">System Metrics</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-white text-black p-6 rounded-lg border border-gray-200 shadow-lg">
                      <h3 className="text-gray-600 text-sm font-bold mb-4 uppercase">API Latency (ms)</h3>
                      <div className="h-32 flex items-end gap-1">
                          {[...Array(30)].map((_, i) => (
                              <div key={i} className="flex-1 bg-blue-500 opacity-80 hover:opacity-100 transition-opacity rounded-t-sm" style={{height: `${Math.random() * 60 + 20}%`}}></div>
                          ))}
                      </div>
                  </div>
                  <div className="bg-white text-black p-6 rounded-lg border border-gray-200 shadow-lg">
                      <h3 className="text-gray-600 text-sm font-bold mb-4 uppercase">Error Rate (%)</h3>
                      <div className="h-32 flex items-end gap-1">
                          {[...Array(30)].map((_, i) => (
                              <div key={i} className="flex-1 bg-green-500 opacity-80 rounded-t-sm" style={{height: '2%'}}></div>
                          ))}
                      </div>
                  </div>
              </div>
          </div>

          {/* Incidents */}
          <div className="mt-16">
              <h2 className="text-xl font-bold border-b border-gray-700 pb-4 mb-6">Past Incidents</h2>
              <div className="space-y-6">
                  <div className="bg-white text-black p-6 rounded-lg border-l-4 border-yellow-500 shadow-lg">
                      <h3 className="font-bold text-lg mb-1">Degraded Performance in EU-West</h3>
                      <p className="text-gray-500 text-sm mb-4">Oct 15, 2024</p>
                      <p className="text-gray-700 text-sm">We identified a latency issue with one of our edge nodes. Traffic was rerouted and the issue has been resolved.</p>
                  </div>
                  <div className="text-center pt-4">
                      <button className="bg-white text-black px-4 py-2 rounded text-sm font-bold hover:bg-gray-200 transition-colors">Incident History →</button>
                  </div>
              </div>
          </div>
      </main>

      <LandingFooter />
    </div>
  );
};

export default StatusPage;
    