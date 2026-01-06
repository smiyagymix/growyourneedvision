
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { OwnerIcon } from '../components/shared/OwnerIcons';
import LandingFooter from '../components/layout/LandingFooter';

const Changelog: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0f172a] text-white font-sans overflow-x-hidden">
      {/* HEADER */}
      <header className="fixed top-0 left-0 right-0 z-50 h-[80px] py-2 bg-[#0f172a]/90 backdrop-blur-md border-b border-blue-900/30">
        <div className="max-w-7xl mx-auto flex flex-row items-center justify-between gap-4 h-full px-8">
           <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
               <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center"><span className="font-bold">v2</span></div>
               <span className="font-bold text-lg">Changelog</span>
           </div>
           <button onClick={() => navigate('/')} className="text-xs font-bold text-gray-400 hover:text-white">Back to Site</button>
        </div>
      </header>

      <section className="pt-32 pb-20 px-4 max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-12 pl-8 border-l-4 border-blue-500">System Evolution</h1>
          
          <div className="space-y-12">
              {[
                  { ver: "v2.4.0", date: "Oct 24, 2024", title: "The Neural Update", desc: "Introduced Concierge AI integration across all modules. Added Role-Aware dashboards.", tags: ["New Feature", "AI"] },
                  { ver: "v2.3.1", date: "Sep 15, 2024", title: "Performance Patch", desc: "Reduced global latency by 40% using edge caching. Fixed Marketplace payment gateway issues.", tags: ["Improvement", "Fix"] },
                  { ver: "v2.3.0", date: "Aug 01, 2024", title: "Creator Studio Launch", desc: "Released the full suite of creative tools including Video Editor and Code Environment.", tags: ["Major Release"] },
              ].map((log, i) => (
                  <div key={i} className="relative pl-8 border-l border-gray-700 group">
                      <div className="absolute left-[-6px] top-0 w-3 h-3 bg-blue-500 rounded-full ring-4 ring-[#0f172a]"></div>
                      <div className="flex items-baseline gap-4 mb-2">
                          <span className="text-2xl font-bold text-white">{log.ver}</span>
                          <span className="text-sm text-gray-500 font-mono">{log.date}</span>
                      </div>
                      <h3 className="text-xl font-bold text-blue-200 mb-3">{log.title}</h3>
                      <p className="text-gray-400 mb-4 leading-relaxed">{log.desc}</p>
                      <div className="flex gap-2">
                          {log.tags.map(tag => (
                              <span key={tag} className="text-[10px] font-bold uppercase px-2 py-1 rounded bg-white/5 text-gray-300 border border-white/10">{tag}</span>
                          ))}
                      </div>
                  </div>
              ))}
          </div>
      </section>

      <LandingFooter />
    </div>
  );
};

export default Changelog;
    