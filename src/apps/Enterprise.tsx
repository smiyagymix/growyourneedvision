
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { OwnerIcon } from '../components/shared/OwnerIcons';
import LandingFooter from '../components/layout/LandingFooter';

const Enterprise: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#050510] text-white font-sans overflow-x-hidden selection:bg-purple-500 selection:text-white">
      {/* HEADER (Shared Style) */}
      <header className="fixed top-0 left-0 right-0 z-50 h-[80px] py-2">
        <div className="absolute inset-0 w-full h-full shadow-[0_10px_30px_-10px_rgba(0,0,0,0.8)] overflow-hidden border-b border-white/10 rounded-b-[40px] bg-[#020205]/80 backdrop-blur-md"></div>
        <div className="max-w-7xl mx-auto flex flex-row items-center justify-between gap-4 h-full px-8 relative z-10">
           <button onClick={() => navigate('/')} className="text-xs font-bold tracking-widest text-gray-400 hover:text-white transition-colors">HOME</button>
           <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
               <OwnerIcon name="Briefcase" className="w-6 h-6 text-purple-500" />
               <span className="font-machina font-bold text-lg">ENTERPRISE</span>
           </div>
           <button onClick={() => navigate('/login')} className="bg-white/10 border border-white/20 px-4 py-1.5 rounded-full text-xs font-bold hover:bg-white hover:text-black transition-colors">LOGIN</button>
        </div>
      </header>

      {/* HERO */}
      <section className="pt-40 pb-20 px-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-purple-900/20 rounded-full blur-[120px] animate-pulse"></div>
          <div className="max-w-6xl mx-auto text-center relative z-10">
              <h1 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tight">
                  SCALE WITHOUT <br/>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-white to-purple-400">COMPROMISE</span>
              </h1>
              <p className="text-xl text-gray-400 max-w-3xl mx-auto font-light leading-relaxed">
                  Custom infrastructure for organizations managing 10,000+ users. White-labeling, dedicated nodes, and priority neural processing.
              </p>
              <div className="mt-10 flex justify-center gap-4">
                  <button className="px-8 py-4 bg-purple-600 text-white rounded-xl font-bold shadow-[0_0_30px_rgba(147,51,234,0.4)] hover:scale-105 transition-transform">Contact Sales</button>
                  <button className="px-8 py-4 bg-transparent border border-white/20 text-white rounded-xl font-bold hover:bg-white/5 transition-colors">Download Architecture</button>
              </div>
          </div>
      </section>

      {/* FEATURES GRID */}
      <section className="py-20 px-4 bg-[#08080c]">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                  { title: "White Labeling", desc: "Your brand, our engine. Full UI customization including domain, logos, and color schemas.", icon: "PaintBrushIcon" },
                  { title: "Dedicated Instances", desc: "Isolated database and compute nodes ensuring 0% noisy neighbor effect.", icon: "ServerIcon" },
                  { title: "SLA Guarantee", desc: "99.99% uptime with financial backing and 24/7 priority engineering support.", icon: "ShieldCheckIcon" },
              ].map((item, i) => (
                  <div key={i} className="bg-[#0f1016] p-8 rounded-3xl border border-white/5 hover:border-purple-500/30 transition-colors group">
                      <div className="w-14 h-14 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-400 mb-6 group-hover:scale-110 transition-transform">
                          <OwnerIcon name={item.icon} className="w-8 h-8" />
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-3">{item.title}</h3>
                      <p className="text-gray-400">{item.desc}</p>
                  </div>
              ))}
          </div>
      </section>

      <LandingFooter />
    </div>
  );
};

export default Enterprise;
    