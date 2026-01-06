
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { OwnerIcon } from './shared/OwnerIcons';
import LandingFooter from './layout/LandingFooter';
import { LandingHero } from './LandingHero';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#050510] text-white font-sans overflow-x-hidden selection:bg-gyn-orange selection:text-white">
      
      {/* --- CUSTOM HEADER --- */}
      <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 group h-[80px] py-2">
        
        {/* Background Chassis - Metallic Realistic Skeuomorphism Blue */}
        <div 
            className="absolute inset-0 w-full h-full shadow-[0_10px_30px_-10px_rgba(0,20,60,0.8)] overflow-hidden border-b border-white/30 rounded-b-[40px]"
            style={{
                background: 'linear-gradient(180deg, #040b1f 0%, #0f256e 40%, #3b82f6 50%, #0f256e 60%, #040b1f 100%)',
            }}
        >
            {/* Brushed Metal Texture */}
            <div className="absolute inset-0 opacity-20 mix-blend-overlay" style={{backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.8\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' opacity=\'1\'/%3E%3C/svg%3E")'}}></div>
            
            {/* 2. High-Fidelity Grid */}
            <div 
                className="absolute inset-0 opacity-30 mix-blend-color-dodge"
                style={{
                    backgroundImage: `
                        linear-gradient(to right, rgba(255, 255, 255, 0.15) 1px, transparent 1px),
                        linear-gradient(to bottom, rgba(255, 255, 255, 0.15) 1px, transparent 1px)
                    `,
                    backgroundSize: '30px 30px',
                    maskImage: 'radial-gradient(circle at center top, black 60%, transparent 100%)'
                }}
            ></div>

            {/* 3. Radial Glow Center */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-gradient-to-b from-blue-300/20 via-transparent to-transparent pointer-events-none mix-blend-screen"></div>
            
            {/* 4. Sharp Specular Highlight */}
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/90 to-transparent shadow-[0_0_15px_white]"></div>

            {/* 5. Bottom Prism Glow */}
            <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-gyn-orange to-transparent opacity-90 blur-[0.5px]"></div>
        </div>

        <div className="max-w-7xl mx-auto flex flex-row items-center justify-between gap-4 h-full px-4 md:px-8 relative z-10">
          
          {/* Left Nav Buttons */}
          <div className="flex items-center gap-2 md:gap-3">
            {[
              { label: 'WHO.we.ARE', path: '/features' },
              { label: 'OuR.FEATURES', path: '/features' }, 
              { label: 'OuR. SERVICES', path: '/services' }
            ].map((btn) => (
              <button 
                key={btn.label} 
                onClick={() => navigate(btn.path)}
                className="group relative px-3 md:px-4 py-2 overflow-hidden rounded-md transition-all duration-300 outline-none bg-black/20 border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] hover:bg-white/10 hover:border-white/30 hover:shadow-[0_0_15px_rgba(48,65,199,0.3)] active:scale-95 hidden sm:block backdrop-blur-sm"
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-gyn-blue-dark/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <span className="relative z-10 font-machina text-[9px] md:text-[10px] font-bold tracking-[0.15em] text-gray-300 group-hover:text-white transition-colors duration-300 group-hover:drop-shadow-[0_0_5px_rgba(255,255,255,0.8)]">
                  {btn.label}
                </span>
                <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gyn-blue-medium scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
              </button>
            ))}
          </div>

          {/* Center Logo */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center group/logo cursor-pointer hover:scale-105 transition-transform duration-500 z-20">
             <div className="w-16 h-16 bg-black rounded-full border border-gyn-orange/50 flex items-center justify-center shadow-[0_0_20px_rgba(245,166,35,0.4),inset_0_0_15px_rgba(0,0,0,0.8)] relative overflow-hidden">
                 <img 
                    src="https://ik.imagekit.io/fve6tqxmf/dall-e-3_b_can_you_create_a_log.png?updatedAt=1763572370466" 
                    alt="Grow Your Need Logo" 
                    className="w-full h-full object-cover scale-110" 
                 />
                 <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/30 to-transparent -translate-x-full group-hover/logo:translate-x-full transition-transform duration-700 pointer-events-none"></div>
             </div>
             <div className="absolute top-1/2 left-full w-12 h-[1px] bg-gradient-to-r from-gyn-orange/60 to-transparent -z-10"></div>
             <div className="absolute top-1/2 right-full w-12 h-[1px] bg-gradient-to-l from-gyn-orange/60 to-transparent -z-10"></div>
          </div>

          {/* Right Nav Buttons */}
          <div className="flex items-center gap-3">
            <button 
                onClick={() => navigate('/contact')}
                className="group relative px-4 py-2 overflow-hidden rounded-md transition-all duration-300 outline-none bg-black/20 border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] hover:bg-white/10 hover:border-white/30 hover:shadow-[0_0_15px_rgba(48,65,199,0.3)] active:scale-95 hidden md:block backdrop-blur-sm"
            >
               <div className="absolute inset-0 bg-gradient-to-tr from-gyn-blue-dark/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
               <span className="relative z-10 font-machina text-[10px] font-bold tracking-[0.15em] text-gray-300 group-hover:text-white transition-colors duration-300">
                 OuR. CONTACTS
               </span>
               <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gyn-blue-medium scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-right"></div>
            </button>

            <button 
              onClick={() => navigate('/login')} 
              className="group relative px-5 py-2 bg-[#0a0a12] border border-white/20 rounded-lg overflow-hidden transition-all duration-300 hover:border-gyn-blue-medium hover:shadow-[0_0_15px_rgba(48,65,199,0.5)] active:scale-95"
            >
               <div className="absolute inset-0 bg-gradient-to-r from-gyn-blue-dark/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
               <span className="relative z-10 font-machina text-[10px] font-bold text-blue-100 tracking-widest uppercase group-hover:text-white transition-colors">
                   Login
               </span>
            </button>

            <button 
              onClick={() => navigate('/login')}
              className="group relative px-6 py-2 rounded-lg overflow-hidden transition-all duration-300 hover:scale-105 shadow-[0_0_15px_rgba(245,166,35,0.3)] hover:shadow-[0_0_25px_rgba(245,166,35,0.6)] active:scale-95 border border-gyn-orange/50"
            >
               <div className="absolute inset-0 bg-gradient-to-r from-gyn-orange via-[#FF8C00] to-gyn-orange"></div>
               <div className="absolute inset-0 shadow-[inset_0_1px_3px_rgba(255,255,255,0.3),inset_0_-1px_3px_rgba(0,0,0,0.1)]"></div>
               <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 animate-pulse"></div>
               <span className="relative z-10 font-machina text-[10px] font-black text-white tracking-widest uppercase flex items-center gap-1 drop-shadow-md">
                   Sign-Up
                   <OwnerIcon name="ChevronRight" className="w-2.5 h-2.5 group-hover:translate-x-1 transition-transform" />
               </span>
            </button>
          </div>
        </div>
      </header>

      {/* --- HERO SECTION --- */}
      <LandingHero />

      {/* --- INFINITE MARQUEE --- */}
      <section className="py-10 bg-black border-y border-white/10 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-black z-10 pointer-events-none"></div>
          <div className="flex gap-12 animate-scroll whitespace-nowrap min-w-full opacity-50 hover:opacity-100 transition-opacity duration-500">
              {[...Array(20)].map((_, i) => (
                  <div key={i} className="flex items-center gap-2 text-xl font-black font-machina text-white/30">
                      <OwnerIcon name="StudioIcon3D" className="w-6 h-6" />
                      PARTNER_NODE_{i}
                  </div>
              ))}
          </div>
      </section>

      {/* --- THE NEURAL ECOSYSTEM (NEW) --- */}
      <section className="py-32 px-4 bg-[#030305] relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10"></div>
          {/* Background Image Overlay */}
          <div className="absolute inset-0 opacity-20 pointer-events-none">
              <img src="https://ik.imagekit.io/fve6tqxmf/b_Ultra-realistic_imag.png?updatedAt=1762326722708" alt="Neural Network" className="w-full h-full object-cover mix-blend-screen" />
          </div>
          
          <div className="max-w-7xl mx-auto relative z-10">
              <div className="text-center mb-20">
                  <h2 className="text-5xl font-black text-white mb-6">The Neural Ecosystem</h2>
                  <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                      A living network where applications don't just coexist—they communicate. 
                      Data flows intelligently from one node to another.
                  </p>
              </div>

              <div className="relative h-[600px] w-full flex items-center justify-center">
                  {/* Central Hub */}
                  <div className="w-40 h-40 bg-gradient-to-br from-gyn-blue-dark to-black rounded-full border-4 border-white/10 shadow-[0_0_100px_rgba(48,65,199,0.6)] z-20 flex items-center justify-center relative group hover:scale-110 transition-transform duration-500">
                      <div className="absolute inset-0 rounded-full border border-gyn-blue-medium opacity-50 animate-ping"></div>
                      <OwnerIcon name="CpuChipIcon" className="w-16 h-16 text-white" />
                      <span className="absolute -bottom-10 text-xs font-bold tracking-widest text-blue-400">CORE ENGINE</span>
                  </div>

                  {/* Satellites */}
                  {[
                      { icon: 'GraduationCap', label: 'EDU', angle: 0, color: 'text-blue-400' },
                      { icon: 'MarketIcon3D', label: 'COMMERCE', angle: 60, color: 'text-green-400' },
                      { icon: 'StudioIcon3D', label: 'CREATE', angle: 120, color: 'text-purple-400' },
                      { icon: 'ShieldCheckIcon', label: 'SECURE', angle: 180, color: 'text-red-400' },
                      { icon: 'ChatBubbleLeftRight', label: 'CONNECT', angle: 240, color: 'text-yellow-400' },
                      { icon: 'Heart', label: 'WELLNESS', angle: 300, color: 'text-pink-400' },
                  ].map((sat, i) => (
                      <div 
                        key={i}
                        className="absolute w-24 h-24 flex flex-col items-center justify-center"
                        style={{
                            top: '50%',
                            left: '50%',
                            transform: `translate(-50%, -50%) rotate(${sat.angle}deg) translate(220px) rotate(-${sat.angle}deg)`
                        }}
                      >
                          <div className="w-16 h-16 bg-[#111] rounded-2xl border border-white/10 flex items-center justify-center shadow-xl hover:border-white/50 hover:bg-white/5 transition-all cursor-pointer group">
                              <OwnerIcon name={sat.icon} className={`w-8 h-8 ${sat.color} group-hover:scale-110 transition-transform`} />
                          </div>
                          <span className="mt-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest bg-black/50 px-2 py-1 rounded">{sat.label}</span>
                          {/* Connector Line */}
                          <div className="absolute top-1/2 left-1/2 w-[140px] h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent -z-10 origin-left"
                               style={{ transform: `rotate(${sat.angle + 180}deg)` }}></div>
                      </div>
                  ))}

                  {/* Orbit Rings */}
                  <div className="absolute inset-0 border border-white/5 rounded-full scale-75 animate-[spin_60s_linear_infinite]"></div>
                  <div className="absolute inset-0 border border-white/5 rounded-full scale-[0.6] animate-[spin_40s_linear_infinite_reverse]"></div>
              </div>
          </div>
      </section>

      {/* --- THE OMNI-DASHBOARD (3D SHOWCASE) --- */}
      <section className="py-32 px-4 relative perspective-1000 overflow-hidden bg-[#020205]">
          <div className="max-w-7xl mx-auto text-center relative z-10 mb-20">
              <h2 className="text-5xl font-black text-white mb-6">The Command Center</h2>
              <p className="text-xl text-gray-400 max-w-2xl mx-auto">Complete visibility. Absolute control. A user interface designed for the next century of management.</p>
          </div>

          <div 
            className="max-w-6xl mx-auto relative transition-transform duration-100 ease-out"
            style={{ transform: `rotateX(${Math.min(20, scrollY * 0.02)}deg) scale(${1 - scrollY * 0.0002})` }}
          >
              <div className="relative rounded-xl overflow-hidden shadow-[0_0_100px_rgba(48,65,199,0.4)] border border-white/20 bg-[#050510] group">
                  <div className="absolute top-0 left-0 w-full h-8 bg-[#111] border-b border-white/10 flex items-center px-4 gap-2 z-20">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  </div>
                  
                  {/* Real Dashboard Image */}
                  <div className="relative h-[600px] w-full overflow-hidden">
                      <img 
                        src="https://ik.imagekit.io/fve6tqxmf/b_Realistic,_professio.png?updatedAt=1762326724334" 
                        alt="Omni Dashboard" 
                        className="w-full h-full object-cover object-top transition-transform duration-1000 group-hover:scale-105"
                      />
                      {/* Overlay Gradient */}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#050510] via-transparent to-transparent"></div>
                  </div>
              </div>
          </div>
      </section>

      {/* --- GLOBAL TRUST (NEW) --- */}
      <section className="py-24 bg-black relative border-t border-white/10">
          <div className="max-w-7xl mx-auto px-4">
              <div className="flex flex-col md:flex-row items-center justify-between gap-12">
                  <div className="flex-1">
                      <h2 className="text-4xl font-black text-white mb-6">Trusted by Visionaries</h2>
                      <p className="text-gray-400 text-lg mb-8">
                          From elite academies to Fortune 500 innovators, the Grow Your Need OS is the backbone of modern digital infrastructure.
                      </p>
                      <div className="flex gap-8 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
                          <div className="flex items-center gap-2 text-2xl font-bold text-white"><OwnerIcon name="GlobeAltIcon" className="w-8 h-8" /> GlobalCorp</div>
                          <div className="flex items-center gap-2 text-2xl font-bold text-white"><OwnerIcon name="AcademicCapIcon" className="w-8 h-8" /> EduTech</div>
                      </div>
                  </div>
                  <div className="flex-1 relative">
                      <div className="w-full h-64 bg-[#0a0a0a] rounded-2xl border border-white/10 relative overflow-hidden group">
                          {/* Movies Image Background */}
                          <img 
                            src="https://ik.imagekit.io/fve6tqxmf/movies.png?updatedAt=1762326724772" 
                            alt="Global Reach" 
                            className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-700"
                          />
                          <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-transparent"></div>
                          
                          {/* Scanning Effect */}
                          <div className="absolute top-0 left-0 w-full h-1 bg-green-500 shadow-[0_0_20px_#22c55e] animate-[scan_3s_linear_infinite]"></div>
                          <div className="p-8 grid grid-cols-2 gap-4 relative z-10">
                              {[1,2,3,4].map(i => (
                                  <div key={i} className="h-20 bg-black/40 backdrop-blur-sm rounded-lg flex items-center justify-center border border-white/10 hover:border-white/30 transition-colors">
                                      <span className="text-xs font-mono text-white/70 font-bold">PARTNER_NODE_{i}</span>
                                  </div>
                              ))}
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      </section>

      {/* --- THE SINGULARITY --- */}
      <section className="py-32 px-4 bg-black relative">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-0 border border-white/10 rounded-3xl overflow-hidden">
              
              {/* Old World */}
              <div className="p-12 bg-[#0a0a0a] relative grayscale opacity-50 hover:opacity-100 transition-opacity duration-500">
                  <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,#222_10px,#222_20px)] opacity-10"></div>
                  <h3 className="text-2xl font-bold text-gray-500 mb-6 uppercase tracking-widest">The Old Way</h3>
                  <ul className="space-y-4">
                      <li className="flex items-center gap-3 text-gray-500"><OwnerIcon name="X" className="w-5 h-5" /> Fragmented Logins</li>
                      <li className="flex items-center gap-3 text-gray-500"><OwnerIcon name="X" className="w-5 h-5" /> Data Silos</li>
                      <li className="flex items-center gap-3 text-gray-500"><OwnerIcon name="X" className="w-5 h-5" /> Expensive Subscriptions</li>
                      <li className="flex items-center gap-3 text-gray-500"><OwnerIcon name="X" className="w-5 h-5" /> Clunky UI/UX</li>
                  </ul>
              </div>

              {/* New World */}
              <div className="p-12 bg-gradient-to-br from-[#0f172a] to-[#1e1b4b] relative overflow-hidden group">
                  {/* Background Image */}
                  <div className="absolute inset-0 opacity-40 group-hover:opacity-60 transition-opacity duration-700">
                      <img 
                        src="https://ik.imagekit.io/fve6tqxmf/a_Ultra-realistic_imag%20(1).png?updatedAt=1762326726015" 
                        alt="Future World" 
                        className="w-full h-full object-cover"
                      />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-[#0f172a]/80 to-transparent"></div>
                  
                  <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 rounded-full blur-[80px] animate-pulse"></div>
                  
                  <h3 className="text-2xl font-bold text-white mb-6 uppercase tracking-widest flex items-center gap-2 relative z-10">
                      <span className="w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_10px_#3b82f6]"></span>
                      Grow Your Need
                  </h3>
                  <ul className="space-y-4 relative z-10">
                      <li className="flex items-center gap-3 text-white font-bold text-lg"><OwnerIcon name="CheckCircleIcon" className="w-6 h-6 text-blue-400" /> Unified Identity</li>
                      <li className="flex items-center gap-3 text-white font-bold text-lg"><OwnerIcon name="CheckCircleIcon" className="w-6 h-6 text-blue-400" /> Neural Data Sync</li>
                      <li className="flex items-center gap-3 text-white font-bold text-lg"><OwnerIcon name="CheckCircleIcon" className="w-6 h-6 text-blue-400" /> All-in-One Pricing</li>
                      <li className="flex items-center gap-3 text-white font-bold text-lg"><OwnerIcon name="CheckCircleIcon" className="w-6 h-6 text-blue-400" /> Liquid Interface</li>
                  </ul>
              </div>

          </div>
      </section>

      <LandingFooter />
    </div>
  );
};

export default LandingPage;
