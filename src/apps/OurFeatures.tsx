
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { OwnerIcon } from '../components/shared/OwnerIcons';
import LandingFooter from '../components/layout/LandingFooter';

const OurFeatures: React.FC = () => {
  const navigate = useNavigate();
  const [activeRole, setActiveRole] = useState<'Admin' | 'Teacher' | 'Student'>('Admin');

  return (
    <div className="min-h-screen bg-[#050510] text-white font-sans overflow-x-hidden selection:bg-gyn-orange selection:text-white">
      
      {/* --- HEADER --- */}
      <header className="fixed top-0 left-0 right-0 z-50 h-[80px] py-2">
        <div className="absolute inset-0 w-full h-full shadow-[0_10px_30px_-10px_rgba(0,20,60,0.8)] overflow-hidden border-b border-white/30 rounded-b-[40px]"
            style={{ background: 'linear-gradient(180deg, #040b1f 0%, #0f256e 40%, #3b82f6 50%, #0f256e 60%, #040b1f 100%)' }}>
            <div className="absolute inset-0 opacity-20 mix-blend-overlay" style={{backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.8\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' opacity=\'1\'/%3E%3C/svg%3E")'}}></div>
            <div className="absolute inset-0 opacity-30 mix-blend-color-dodge" style={{backgroundImage: `linear-gradient(to right, rgba(255, 255, 255, 0.15) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.15) 1px, transparent 1px)`, backgroundSize: '30px 30px', maskImage: 'radial-gradient(circle at center top, black 60%, transparent 100%)'}}></div>
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/90 to-transparent shadow-[0_0_15px_white]"></div>
            <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-gyn-orange to-transparent opacity-90 blur-[0.5px]"></div>
        </div>

        <div className="max-w-7xl mx-auto flex flex-row items-center justify-between gap-4 h-full px-4 md:px-8 relative z-10">
          <div className="flex items-center gap-2 md:gap-3">
             <button onClick={() => navigate('/')} className="group relative px-4 py-2 overflow-hidden rounded-md transition-all duration-300 outline-none bg-black/20 border border-white/10 hover:bg-white/10 hover:border-white/30 backdrop-blur-sm">
                <span className="relative z-10 font-machina text-[10px] font-bold tracking-[0.15em] text-gray-300 group-hover:text-white">HOME</span>
             </button>
          </div>
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center cursor-pointer hover:scale-105 transition-transform duration-500 z-20" onClick={() => navigate('/')}>
             <div className="w-16 h-16 bg-black rounded-full border border-gyn-orange/50 flex items-center justify-center shadow-[0_0_20px_rgba(245,166,35,0.4)] relative overflow-hidden">
                 <img src="https://ik.imagekit.io/fve6tqxmf/dall-e-3_b_can_you_create_a_log.png?updatedAt=1763572370466" alt="Logo" className="w-full h-full object-cover scale-110" />
             </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/login')} className="group relative px-5 py-2 bg-[#0a0a12] border border-white/20 rounded-lg overflow-hidden transition-all duration-300 hover:border-gyn-blue-medium hover:shadow-[0_0_15px_rgba(48,65,199,0.5)] active:scale-95">
               <span className="relative z-10 font-machina text-[10px] font-bold text-blue-100 tracking-widest uppercase group-hover:text-white">Login</span>
            </button>
          </div>
        </div>
      </header>

      {/* --- HERO BLOCK --- */}
      <section className="pt-40 pb-20 px-4 relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] animate-pulse"></div>
          <div className="max-w-5xl mx-auto text-center relative z-10">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-6 animate-fadeIn">
                  <OwnerIcon name="Sparkles" className="w-4 h-4 text-gyn-orange" />
                  <span className="text-xs font-bold text-blue-200 tracking-widest uppercase">System Architecture v2.0</span>
              </div>
              <h1 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tight drop-shadow-[0_0_30px_rgba(59,130,246,0.5)]">
                  THE ENGINE OF <br/>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-gyn-blue-light via-white to-gyn-blue-light">TOMORROW</span>
              </h1>
              <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
                  Experience a unified digital ecosystem where data flows seamlessly between education, creativity, and commerce. One platform. Infinite potential.
              </p>
          </div>
      </section>

      {/* --- NEURAL ARCHITECTURE --- */}
      <section className="py-24 px-4 relative bg-[#080910] overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:40px_40px]"></div>
          <div className="max-w-7xl mx-auto relative z-10">
              <div className="text-center mb-16">
                  <h2 className="text-3xl font-bold text-white mb-4">Neural Core Integration</h2>
                  <p className="text-gray-400 max-w-2xl mx-auto">Our proprietary AI node graph connects every module instantly.</p>
              </div>
              <div className="relative h-[600px] flex items-center justify-center">
                  <div className="w-48 h-48 bg-black rounded-full border-2 border-gyn-blue-medium shadow-[0_0_60px_rgba(48,65,199,0.6)] flex items-center justify-center relative z-20 group hover:scale-110 transition-transform duration-500">
                      <div className="absolute inset-0 bg-gyn-blue-medium/20 rounded-full animate-ping"></div>
                      <div className="w-40 h-40 bg-gradient-to-br from-gyn-blue-dark to-black rounded-full flex items-center justify-center border border-white/20 relative overflow-hidden">
                          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-30"></div>
                          <OwnerIcon name="CpuChipIcon" className="w-16 h-16 text-white animate-pulse" />
                      </div>
                  </div>
                  {[
                      { icon: 'GraduationCap', label: 'Education', color: 'text-blue-400', pos: 'top-0 left-1/4' },
                      { icon: 'MarketIcon3D', label: 'Commerce', color: 'text-green-400', pos: 'top-20 right-1/4' },
                      { icon: 'StudioIcon3D', label: 'Creation', color: 'text-purple-400', pos: 'bottom-20 left-1/4' },
                      { icon: 'ShieldCheckIcon', label: 'Security', color: 'text-orange-400', pos: 'bottom-0 right-1/4' },
                  ].map((node, i) => (
                      <div key={i} className={`absolute ${node.pos} w-32 h-32 flex flex-col items-center justify-center animate-float`} style={{animationDelay: `${i}s`}}>
                          <div className="w-16 h-16 bg-[#111] rounded-2xl border border-white/10 flex items-center justify-center shadow-xl mb-2 hover:border-white/50 transition-colors group cursor-pointer">
                              <OwnerIcon name={node.icon} className={`w-8 h-8 ${node.color} group-hover:scale-110 transition-transform`} />
                          </div>
                          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest bg-black/50 px-2 py-1 rounded backdrop-blur-sm">{node.label}</span>
                          <div className="absolute top-1/2 left-1/2 w-[200px] h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent -z-10 origin-left transform rotate-[45deg]" style={{ transform: `rotate(${i * 90 + 45}deg) translateX(-100px)`}}></div>
                      </div>
                  ))}
                  <div className="absolute inset-0 pointer-events-none">
                      <div className="absolute top-1/2 left-1/2 w-[600px] h-[600px] border border-white/5 rounded-full -translate-x-1/2 -translate-y-1/2 animate-[spin_20s_linear_infinite]"></div>
                      <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] border border-white/10 rounded-full -translate-x-1/2 -translate-y-1/2 animate-[spin_15s_linear_infinite_reverse]"></div>
                  </div>
              </div>
          </div>
      </section>

      {/* --- BENTO GRID --- */}
      <section className="py-20 px-4 bg-gradient-to-b from-[#080910] to-[#0a0a15]">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[minmax(300px,auto)]">
              <div className="md:col-span-2 row-span-2 bg-[#0f1016] rounded-[30px] border border-white/5 p-10 relative overflow-hidden group hover:border-gyn-blue-medium/30 transition-colors">
                  <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                  <div className="absolute inset-0 bg-gradient-to-br from-gyn-blue-dark/20 to-transparent"></div>
                  <div className="relative z-10 h-full flex flex-col justify-between">
                      <div>
                          <h3 className="text-3xl font-bold text-white mb-4">Unified Operating System</h3>
                          <p className="text-gray-400 max-w-md">Unlike fragmented SaaS tools, Grow Your Need provides a single, cohesive environment where School Management talks to CRM, and AI assists in every interaction.</p>
                      </div>
                      <div className="mt-10 relative h-64 w-full bg-black/40 rounded-2xl border border-white/10 overflow-hidden shadow-2xl flex items-center justify-center group-hover:scale-[1.02] transition-transform duration-500">
                          <div className="absolute inset-4 border border-white/5 rounded-xl bg-[#050510] p-4">
                              <div className="flex gap-4 h-full">
                                  <div className="w-16 h-full bg-white/5 rounded-lg"></div>
                                  <div className="flex-1 space-y-3">
                                      <div className="h-8 w-1/3 bg-gyn-blue-medium/20 rounded"></div>
                                      <div className="h-32 w-full bg-white/5 rounded"></div>
                                      <div className="flex gap-2">
                                          <div className="h-12 flex-1 bg-white/5 rounded"></div>
                                          <div className="h-12 flex-1 bg-white/5 rounded"></div>
                                      </div>
                                  </div>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
              <div className="bg-[#0f1016] rounded-[30px] border border-white/5 p-8 relative overflow-hidden group hover:border-purple-500/30 transition-colors">
                  <div className="absolute -right-10 -top-10 w-40 h-40 bg-purple-600/20 rounded-full blur-3xl group-hover:bg-purple-600/40 transition-colors"></div>
                  <OwnerIcon name="StudioIcon3D" className="w-16 h-16 text-purple-400 mb-6 drop-shadow-lg" />
                  <h3 className="text-2xl font-bold text-white mb-2">Creator Studio</h3>
                  <p className="text-sm text-gray-400">Professional-grade design, video editing, and coding tools built directly into your browser.</p>
              </div>
              <div className="bg-[#0f1016] rounded-[30px] border border-white/5 p-8 relative overflow-hidden group hover:border-gyn-orange/30 transition-colors">
                  <div className="absolute -right-10 -top-10 w-40 h-40 bg-gyn-orange/20 rounded-full blur-3xl group-hover:bg-gyn-orange/40 transition-colors"></div>
                  <OwnerIcon name="Sparkles" className="w-16 h-16 text-gyn-orange mb-6 drop-shadow-lg" />
                  <h3 className="text-2xl font-bold text-white mb-2">Concierge AI</h3>
                  <p className="text-sm text-gray-400">A role-aware AI assistant that automates grading, scheduling, and content generation.</p>
              </div>
              <div className="md:col-span-3 bg-gradient-to-r from-[#0f1016] to-[#1a1a24] rounded-[30px] border border-white/5 p-10 flex flex-col md:flex-row items-center gap-10 relative overflow-hidden">
                  <div className="flex-1 relative z-10">
                      <h3 className="text-3xl font-bold text-white mb-4">Global Marketplace</h3>
                      <p className="text-gray-400 mb-6">Buy and sell educational resources, digital assets, and services. Integrated directly with your wallet and inventory system.</p>
                      <div className="flex gap-4">
                          {['Secure Payments', 'Instant Delivery', 'Creator Economy'].map(tag => (<span key={tag} className="px-3 py-1 rounded-full border border-white/10 text-xs font-bold text-gray-300 bg-white/5">{tag}</span>))}
                      </div>
                  </div>
                  <div className="flex-1 w-full flex justify-center relative z-10">
                      <div className="w-full max-w-md grid grid-cols-2 gap-4">
                          <div className="bg-[#050510] p-4 rounded-2xl border border-white/10 flex items-center gap-3 shadow-lg">
                              <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center text-green-400"><OwnerIcon name="MarketIcon3D" className="w-5 h-5" /></div>
                              <div><div className="text-white font-bold">$12,450</div><div className="text-[10px] text-gray-500">Volume</div></div>
                          </div>
                          <div className="bg-[#050510] p-4 rounded-2xl border border-white/10 flex items-center gap-3 shadow-lg translate-y-4">
                              <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400"><OwnerIcon name="UserGroup" className="w-5 h-5" /></div>
                              <div><div className="text-white font-bold">850+</div><div className="text-[10px] text-gray-500">Sellers</div></div>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      </section>

      {/* --- INTERACTIVE ROLE SIMULATOR (NEW BLOCK) --- */}
      <section className="py-24 px-4 bg-[#050510] relative border-t border-white/5">
          <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                  <h2 className="text-4xl font-black text-white mb-4">One Platform. <span className="text-gyn-blue-medium">Adaptive Views.</span></h2>
                  <p className="text-gray-400">See how the interface morphs based on who is logging in.</p>
              </div>

              <div className="flex justify-center gap-4 mb-10">
                  {['Admin', 'Teacher', 'Student'].map((role) => (
                      <button 
                        key={role}
                        onClick={() => setActiveRole(role as any)}
                        className={`px-6 py-2 rounded-full font-bold text-sm transition-all duration-300 border ${activeRole === role ? 'bg-white text-black border-white' : 'bg-transparent text-gray-500 border-white/10 hover:border-white/30'}`}
                      >
                          {role} View
                      </button>
                  ))}
              </div>

              <div className="bg-[#0f1016] rounded-2xl border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] p-2 md:p-8 relative overflow-hidden transition-all duration-500 min-h-[400px]">
                  {/* Simulated UI based on Role */}
                  <div className="flex flex-col h-full gap-6 animate-fadeIn">
                      <div className="flex justify-between items-center border-b border-white/5 pb-4">
                          <div className="flex items-center gap-4">
                              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl ${activeRole === 'Admin' ? 'bg-gyn-blue-medium' : activeRole === 'Teacher' ? 'bg-orange-500' : 'bg-green-500'}`}>
                                  {activeRole[0]}
                              </div>
                              <div>
                                  <h3 className="text-xl font-bold text-white">Welcome back, {activeRole}</h3>
                                  <p className="text-xs text-gray-500">System ID: #8821-A</p>
                              </div>
                          </div>
                          <div className="text-right">
                              <div className="text-2xl font-mono text-white">
                                  {activeRole === 'Admin' ? '$42,500' : activeRole === 'Teacher' ? '3 Classes' : '92% Avg'}
                              </div>
                              <div className="text-[10px] text-gray-500 uppercase tracking-widest">
                                  {activeRole === 'Admin' ? 'Monthly Revenue' : activeRole === 'Teacher' ? 'Active Sessions' : 'Grade Performance'}
                              </div>
                          </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {activeRole === 'Admin' && (
                              <>
                                  <div className="bg-black/40 p-6 rounded-xl border border-white/5"><h4 className="text-gray-400 text-xs uppercase mb-2">System Health</h4><div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden"><div className="h-full bg-green-500 w-[98%]"></div></div></div>
                                  <div className="bg-black/40 p-6 rounded-xl border border-white/5"><h4 className="text-gray-400 text-xs uppercase mb-2">New Tenants</h4><div className="text-3xl text-white font-bold">+12</div></div>
                                  <div className="bg-black/40 p-6 rounded-xl border border-white/5"><h4 className="text-gray-400 text-xs uppercase mb-2">Support Tickets</h4><div className="text-3xl text-white font-bold">5</div></div>
                              </>
                          )}
                          {activeRole === 'Teacher' && (
                              <>
                                  <div className="bg-black/40 p-6 rounded-xl border border-white/5"><h4 className="text-gray-400 text-xs uppercase mb-2">Next Class</h4><div className="text-xl text-white font-bold">Physics 101</div><div className="text-xs text-orange-400">In 15 mins</div></div>
                                  <div className="bg-black/40 p-6 rounded-xl border border-white/5"><h4 className="text-gray-400 text-xs uppercase mb-2">Grading Queue</h4><div className="text-3xl text-white font-bold">24</div></div>
                                  <div className="bg-black/40 p-6 rounded-xl border border-white/5"><h4 className="text-gray-400 text-xs uppercase mb-2">Lesson Plan</h4><button className="text-xs bg-white/10 px-2 py-1 rounded text-white">Generate with AI</button></div>
                              </>
                          )}
                          {activeRole === 'Student' && (
                              <>
                                  <div className="bg-black/40 p-6 rounded-xl border border-white/5"><h4 className="text-gray-400 text-xs uppercase mb-2">Assignments Due</h4><div className="text-3xl text-red-400 font-bold">2</div></div>
                                  <div className="bg-black/40 p-6 rounded-xl border border-white/5"><h4 className="text-gray-400 text-xs uppercase mb-2">Study Streak</h4><div className="text-3xl text-white font-bold">14 Days</div></div>
                                  <div className="bg-black/40 p-6 rounded-xl border border-white/5"><h4 className="text-gray-400 text-xs uppercase mb-2">GPA Trend</h4><div className="h-10 flex items-end gap-1"><div className="w-2 h-4 bg-green-500"></div><div className="w-2 h-6 bg-green-500"></div><div className="w-2 h-8 bg-green-500"></div></div></div>
                              </>
                          )}
                      </div>
                  </div>
              </div>
          </div>
      </section>

      {/* --- SECURITY PROTOCOL --- */}
      <section className="py-24 px-4 bg-black relative border-t border-white/10">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-16">
              <div className="flex-1 space-y-8">
                  <div className="inline-block border border-red-500/50 px-3 py-1 rounded text-xs font-bold text-red-400 uppercase tracking-widest mb-2">Enterprise Grade</div>
                  <h2 className="text-4xl font-black text-white">Ironclad Security Protocol</h2>
                  <p className="text-gray-400 text-lg">Your data is protected by military-grade encryption, real-time threat detection, and decentralized backups. We don't just store data; we fortify it.</p>
                  <ul className="space-y-4">
                      {['End-to-End Encryption', 'Biometric Authentication Support', 'GDPR & FERPA Compliant', '24/7 Threat Monitoring'].map(item => (
                          <li key={item} className="flex items-center gap-3 text-gray-300 font-medium"><OwnerIcon name="CheckCircleIcon" className="w-5 h-5 text-gyn-blue-medium" />{item}</li>
                      ))}
                  </ul>
              </div>
              <div className="flex-1 relative">
                  <div className="relative w-full aspect-square max-w-md mx-auto border border-white/10 rounded-full flex items-center justify-center">
                      <div className="absolute inset-0 border border-dashed border-white/20 rounded-full animate-[spin_30s_linear_infinite]"></div>
                      <div className="absolute inset-12 border border-white/10 rounded-full"></div>
                      <div className="w-48 h-48 bg-gradient-to-b from-gyn-blue-dark/50 to-transparent rounded-full flex items-center justify-center border border-white/20 shadow-[0_0_50px_rgba(48,65,199,0.3)] relative overflow-hidden">
                          <div className="absolute inset-0 bg-[linear-gradient(transparent_2px,#000_3px)] bg-[size:100%_4px] opacity-20"></div>
                          <OwnerIcon name="ShieldCheckIcon" className="w-20 h-20 text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]" />
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-green-500/20 to-transparent h-full w-full animate-[scan_4s_ease-in-out_infinite] opacity-50 pointer-events-none"></div>
                  </div>
              </div>
          </div>
      </section>

      {/* --- CTA BLOCK --- */}
      <section className="py-20 relative">
          <div className="absolute inset-0 bg-gradient-to-t from-gyn-blue-dark/20 to-transparent pointer-events-none"></div>
          <div className="max-w-4xl mx-auto text-center relative z-10 px-4">
              <h2 className="text-4xl font-black text-white mb-8">Ready to Upgrade Your Reality?</h2>
              <button onClick={() => navigate('/login')} className="bg-white text-black px-10 py-4 rounded-full font-black tracking-wider uppercase hover:scale-105 transition-transform shadow-[0_0_30px_white]">Initialize System</button>
          </div>
      </section>

      <LandingFooter />
    </div>
  );
};

export default OurFeatures;
