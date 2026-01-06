
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../components/shared/ui/CommonUI';
import LandingFooter from '../components/layout/LandingFooter';

const SecurityPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black text-white font-sans overflow-x-hidden selection:bg-green-500 selection:text-black animate-fadeIn">
      {/* HEADER */}
      <header className="fixed top-0 left-0 right-0 z-50 h-[80px] py-2">
        <div className="absolute inset-0 w-full h-full border-b border-green-900/30 bg-black/90 backdrop-blur-md"></div>
        <div className="max-w-7xl mx-auto flex flex-row items-center justify-between gap-4 h-full px-8 relative z-10">
           <button onClick={() => navigate('/')} className="text-xs font-bold tracking-widest text-gray-500 hover:text-white">HOME</button>
           <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
               <Icon name="ShieldCheckIcon" className="w-6 h-6 text-green-500" />
               <span className="font-machina font-bold text-lg tracking-wider">SECURITY_CORE</span>
           </div>
           <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        </div>
      </header>

      {/* HERO */}
      <section className="pt-40 pb-20 px-4 relative">
          <div className="absolute inset-0 bg-[linear-gradient(transparent_1px,#002200_1px),linear-gradient(90deg,transparent_1px,#002200_1px)] bg-[size:20px_20px] opacity-20"></div>
          <div className="max-w-5xl mx-auto text-center relative z-10">
              <div className="inline-block border border-green-500/50 px-3 py-1 rounded text-xs font-mono text-green-400 mb-6 bg-green-900/10">MILITARY GRADE ENCRYPTION DETECTED</div>
              <h1 className="text-5xl md:text-8xl font-black text-white mb-6 tracking-tighter font-machina">
                  FORTRESS <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-700">ARCH</span>
              </h1>
              <p className="text-lg text-gray-400 max-w-2xl mx-auto">
                  We treat your data as a sovereign asset. End-to-end encryption, zero-knowledge architecture, and continuous threat modeling.
              </p>
          </div>
      </section>

      {/* COMPLIANCE BADGES */}
      <section className="py-10 border-y border-white/10 bg-[#050505]">
          <div className="max-w-7xl mx-auto flex justify-around flex-wrap gap-8 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
              {['GDPR Ready', 'SOC2 Type II', 'HIPAA Compliant', 'ISO 27001', 'FERPA'].map(badge => (
                  <div key={badge} className="flex items-center gap-2 text-xl font-bold text-white">
                      <Icon name="CheckCircleIcon" className="w-6 h-6 text-green-500" />
                      {badge}
                  </div>
              ))}
          </div>
      </section>

      {/* THREAT MAP SIMULATION */}
      <section className="py-24 px-4">
          <div className="max-w-6xl mx-auto bg-[#0a0a0a] border border-green-900/30 rounded-xl p-2 relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10"></div>
              <div className="h-[400px] bg-black rounded-lg relative overflow-hidden flex items-center justify-center">
                  <div className="absolute inset-0 opacity-30" style={{backgroundImage: 'radial-gradient(#14532d 1px, transparent 1px)', backgroundSize: '30px 30px'}}></div>
                  <div className="w-64 h-64 border border-green-500/30 rounded-full animate-ping absolute"></div>
                  <div className="w-48 h-48 border border-green-500/50 rounded-full animate-ping delay-100 absolute"></div>
                  <Icon name="GlobeAltIcon" className="w-32 h-32 text-green-800 relative z-10" />
                  <div className="absolute top-10 left-10 font-mono text-xs text-green-500">
                      <p>THREAT_LEVEL: LOW</p>
                      <p>PACKETS_SEC: 45,021</p>
                      <p>FIREWALL: ACTIVE</p>
                  </div>
              </div>
          </div>
      </section>

      <LandingFooter />
    </div>
  );
};

export default SecurityPage;
    