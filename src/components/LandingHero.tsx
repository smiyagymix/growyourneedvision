import React from 'react';
import { useNavigate } from 'react-router-dom';
import { OwnerIcon } from './shared/OwnerIcons';

export const LandingHero: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section className="relative pt-32 pb-20 px-4 md:px-8 overflow-hidden min-h-screen flex items-center z-10">
       <div className="max-w-7xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-center">
          
          {/* Left Content */}
          <div className="text-left space-y-6 md:space-y-8 animate-slideInLeft relative z-20">
             <div>
                 <div className="inline-flex items-center gap-3 px-3 py-1 md:px-4 md:py-1.5 rounded-full border border-cyan-500/30 bg-cyan-950/20 backdrop-blur-md mb-6 md:mb-8 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
                     <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                      </span>
                     <span className="text-[9px] md:text-[10px] font-bold tracking-[0.2em] uppercase text-cyan-300">System v2.4 Live</span>
                 </div>
                 {/* Adjusted text sizes for tablet (md) split view to ensure single line */}
                 <h1 className="text-4xl sm:text-5xl md:text-3xl lg:text-5xl xl:text-6xl 2xl:text-7xl font-machina font-black tracking-tighter text-white mb-4 md:mb-6 leading-tight whitespace-nowrap">
                     GROW <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-white to-purple-400 relative">YOUR NEED</span>
                 </h1>
                 <h2 className="text-base md:text-lg lg:text-xl font-light tracking-wide text-gray-400 max-w-lg border-l-2 border-cyan-500/30 pl-4 md:pl-6">
                     The Operating System for your Digital Legacy. Unified. Intelligent. Limitless.
                 </h2>
             </div>

             {/* Glass Box */}
             <div className="bg-white/5 backdrop-blur-md border border-white/10 p-5 md:p-6 rounded-2xl relative overflow-hidden group hover:bg-white/10 transition-all duration-500 hover:border-cyan-500/30 max-w-md">
                 <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"></div>
                 <div className="absolute top-0 right-0 p-4 opacity-30">
                     <OwnerIcon name="CpuChipIcon" className="w-10 h-10 md:w-12 md:h-12 text-white" />
                 </div>
                 
                 <h3 className="text-base md:text-lg font-bold text-white mb-2 flex items-center gap-2">
                     <OwnerIcon name="BoltIcon" className="w-4 h-4 md:w-5 md:h-5 text-cyan-400" />
                     Unified Intelligence
                 </h3>
                 <p className="text-gray-400 leading-relaxed text-xs sm:text-sm">
                     Replace 20+ fragmented apps with one neural platform. School management, creative studio, and marketplace—seamlessly integrated.
                 </p>
             </div>

             {/* CTA */}
             <div className="flex flex-wrap gap-4">
                 <button 
                      onClick={() => navigate('/features')}
                      className="group px-5 py-2.5 md:px-6 md:py-3 bg-white text-black font-black rounded-xl shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:shadow-[0_0_50px_rgba(6,182,212,0.4)] hover:scale-105 transition-all active:scale-95 flex items-center gap-2 text-xs md:text-sm"
                 >
                     <OwnerIcon name="Sparkles" className="w-4 h-4 text-black group-hover:text-cyan-600 transition-colors" />
                     INITIALIZE SYSTEM
                 </button>
                 <button 
                      onClick={() => navigate('/docs')}
                      className="px-5 py-2.5 md:px-6 md:py-3 bg-transparent border border-white/20 text-white font-bold rounded-xl hover:bg-white/5 hover:border-cyan-500/50 hover:text-cyan-300 transition-all flex items-center gap-2 text-xs md:text-sm"
                 >
                     Read Documentation
                 </button>
             </div>
          </div>

          {/* Right Visual - 3D Floater */}
          <div className="relative h-[400px] md:h-[500px] lg:h-[600px] w-full animate-slideInRight perspective-[2000px] flex items-center justify-center">
              {/* Floating Cards 3D */}
              <div className="w-[280px] h-[400px] md:w-[300px] md:h-[460px] lg:w-[360px] lg:h-[520px] bg-[#0a0a0a] border border-gray-800 rounded-3xl shadow-2xl transform rotate-y-[-15deg] rotate-x-[5deg] z-10 p-4 md:p-6 flex flex-col hover:rotate-y-0 hover:rotate-x-0 transition-transform duration-700 ease-out group relative overflow-hidden">
                  {/* Background Image (Emaraty Visionary) */}
                  <div className="absolute inset-0 opacity-40 group-hover:opacity-60 transition-opacity duration-700">
                      <img 
                        src="https://ik.imagekit.io/fve6tqxmf/emaraty.jpeg?updatedAt=1762326727215" 
                        alt="Visionary" 
                        className="w-full h-full object-cover"
                      />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>

                  {/* Screen Glare */}
                  <div className="absolute -top-[50%] -left-[50%] w-[200%] h-[200%] bg-gradient-to-br from-white/5 via-transparent to-transparent rotate-45 pointer-events-none"></div>
                  
                  {/* Simulated Interface */}
                  <div className="flex items-center justify-between mb-4 md:mb-6 border-b border-white/10 pb-3 md:pb-4 relative z-10">
                      <div className="flex gap-1.5 md:gap-2">
                          <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-red-500/80"></div>
                          <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-yellow-500/80"></div>
                          <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-green-500/80"></div>
                      </div>
                      <div className="text-[8px] md:text-[10px] font-mono text-cyan-500 animate-pulse bg-black/50 px-2 py-1 rounded">LIVE_FEED :: CONNECTED</div>
                  </div>
                  
                  <div className="flex-1 space-y-3 md:space-y-4 relative z-10 mt-auto">
                      <div className="h-32 md:h-40 bg-black/40 backdrop-blur-md rounded-xl border border-white/10 relative overflow-hidden group-hover:border-cyan-500/50 transition-colors p-4">
                          <div className="flex items-center gap-3 mb-2">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-white font-bold text-xs">
                                  GYN
                              </div>
                              <div>
                                  <div className="text-xs text-white font-bold">System Status</div>
                                  <div className="text-[10px] text-green-400">● Optimal</div>
                              </div>
                          </div>
                          <div className="space-y-2">
                              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                  <div className="h-full bg-cyan-500 w-[85%]"></div>
                              </div>
                              <div className="flex justify-between text-[10px] text-gray-400">
                                  <span>Performance</span>
                                  <span>98%</span>
                              </div>
                          </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 md:gap-4">
                          <div className="h-20 md:h-24 bg-black/40 backdrop-blur-md rounded-xl border border-white/10 flex flex-col items-center justify-center hover:bg-white/10 transition-colors">
                              <span className="text-xl md:text-2xl font-black text-white">12k</span>
                              <span className="text-[10px] font-bold text-gray-400 uppercase">Users</span>
                          </div>
                          <div className="h-20 md:h-24 bg-black/40 backdrop-blur-md rounded-xl border border-white/10 flex flex-col items-center justify-center hover:bg-white/10 transition-colors">
                              <span className="text-xl md:text-2xl font-black text-cyan-400">85</span>
                              <span className="text-[10px] font-bold text-gray-400 uppercase">Nodes</span>
                          </div>
                      </div>
                  </div>
              </div>

              {/* Back Card Decoration */}
              <div className="absolute w-[260px] h-[360px] md:w-[280px] md:h-[420px] lg:w-[340px] lg:h-[480px] bg-purple-500/5 border border-purple-500/20 rounded-3xl transform translate-x-8 md:translate-x-12 -translate-z-20 -rotate-y-[10deg] rotate-z-[-2deg] blur-[1px]"></div>
              
              {/* Floating Elements */}
              <div className="absolute top-16 right-6 md:top-20 md:right-10 p-3 md:p-4 bg-black/80 backdrop-blur-md rounded-xl border border-cyan-500/50 shadow-[0_0_30px_rgba(6,182,212,0.3)] animate-float">
                  <OwnerIcon name="ShieldCheckIcon" className="w-5 h-5 md:w-6 md:h-6 text-cyan-400" />
              </div>
          </div>
       </div>
    </section>
  );
};
