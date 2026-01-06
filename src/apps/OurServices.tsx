
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { OwnerIcon } from '../components/shared/OwnerIcons';
import LandingFooter from '../components/layout/LandingFooter';

const OurServices: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#050510] text-white font-sans overflow-x-hidden selection:bg-gyn-blue-medium selection:text-white">
      
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
      <section className="pt-40 pb-20 px-4 relative">
          <div className="max-w-6xl mx-auto text-center relative z-10">
              <h1 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tighter">
                  EMPOWERING YOUR <br/>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">VISION</span>
              </h1>
              <p className="text-xl text-gray-400 max-w-3xl mx-auto font-light">
                  Scalable solutions for individuals, institutions, and enterprises. Select the tier that fits your ambition.
              </p>
          </div>
      </section>

      {/* --- IMPACT METRICS TICKER (NEW) --- */}
      <section className="border-y border-white/10 bg-black/50 py-8 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-black z-10"></div>
          <div className="flex justify-around max-w-7xl mx-auto text-center relative z-0 px-4">
              {[
                  { val: "99.99%", label: "Uptime SLA" },
                  { val: "15ms", label: "Latency" },
                  { val: "2.4M+", label: "Daily Users" },
                  { val: "$500M+", label: "Processed" }
              ].map((metric, i) => (
                  <div key={i} className="flex flex-col">
                      <span className="text-2xl md:text-4xl font-black text-white font-machina">{metric.val}</span>
                      <span className="text-[10px] uppercase tracking-widest text-gyn-blue-medium font-bold">{metric.label}</span>
                  </div>
              ))}
          </div>
      </section>

      {/* --- DEPLOYMENT ROADMAP --- */}
      <section className="py-20 bg-[#0a0a12] overflow-hidden relative">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10"></div>
          <div className="max-w-7xl mx-auto px-4 relative z-10">
              <h2 className="text-3xl font-bold text-white mb-16 text-center">Deployment Protocol</h2>
              <div className="relative">
                  <div className="absolute top-1/2 left-0 w-full h-1 bg-white/10 -translate-y-1/2 hidden md:block"></div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                      {[
                          { title: "Initialize", desc: "Create your admin account", icon: "UserIcon" },
                          { title: "Configure", desc: "Select modules & AI rules", icon: "CogIcon" },
                          { title: "Import", desc: "Migrate existing data", icon: "ArrowDownTrayIcon" },
                          { title: "Launch", desc: "Go live globally", icon: "RocketLaunchIcon" },
                      ].map((step, i) => (
                          <div key={i} className="relative flex flex-col items-center text-center group">
                              <div className="w-16 h-16 bg-[#111] rounded-full border-2 border-white/20 flex items-center justify-center text-gray-400 shadow-xl mb-6 group-hover:border-gyn-blue-medium group-hover:text-white group-hover:scale-110 transition-all relative z-10">
                                  <OwnerIcon name={step.icon} className="w-8 h-8" />
                                  <div className="absolute -bottom-2 bg-black px-2 text-[10px] font-mono text-gray-500 border border-white/10 rounded">0{i+1}</div>
                              </div>
                              <h3 className="text-xl font-bold text-white mb-2">{step.title}</h3>
                              <p className="text-sm text-gray-400 max-w-[150px]">{step.desc}</p>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      </section>

      {/* --- INDUSTRY SOLUTIONS --- */}
      <section className="py-24 px-4">
          <div className="max-w-7xl mx-auto">
              <h2 className="text-4xl font-black text-white mb-12 text-center">Tailored Solutions</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-gradient-to-br from-blue-900/20 to-transparent p-10 rounded-[40px] border border-white/10 hover:border-blue-500/50 transition-all group relative overflow-hidden">
                      <div className="absolute right-0 bottom-0 opacity-10 group-hover:opacity-20 transition-opacity transform translate-x-10 translate-y-10"><OwnerIcon name="AcademicCapIcon" className="w-64 h-64 text-blue-500" /></div>
                      <h3 className="text-3xl font-bold text-white mb-4">Education</h3>
                      <p className="text-gray-300 mb-8 max-w-md text-lg">Complete SIS, LMS, and AI tutoring integration for modern campuses.</p>
                      <ul className="space-y-3 mb-8">
                          <li className="flex items-center gap-3 text-blue-200"><div className="w-2 h-2 bg-blue-500 rounded-full"></div>Auto-Grading</li>
                          <li className="flex items-center gap-3 text-blue-200"><div className="w-2 h-2 bg-blue-500 rounded-full"></div>Parent Portals</li>
                          <li className="flex items-center gap-3 text-blue-200"><div className="w-2 h-2 bg-blue-500 rounded-full"></div>Attendance Tracking</li>
                      </ul>
                      <button className="text-blue-400 font-bold uppercase tracking-widest text-sm hover:text-white transition-colors flex items-center gap-2">View Case Study <OwnerIcon name="ArrowRightIcon" className="w-4 h-4"/></button>
                  </div>
                  <div className="bg-gradient-to-br from-purple-900/20 to-transparent p-10 rounded-[40px] border border-white/10 hover:border-purple-500/50 transition-all group relative overflow-hidden">
                      <div className="absolute right-0 bottom-0 opacity-10 group-hover:opacity-20 transition-opacity transform translate-x-10 translate-y-10"><OwnerIcon name="Briefcase" className="w-64 h-64 text-purple-500" /></div>
                      <h3 className="text-3xl font-bold text-white mb-4">Enterprise</h3>
                      <p className="text-gray-300 mb-8 max-w-md text-lg">Workforce management, CRM, and internal communication at scale.</p>
                      <ul className="space-y-3 mb-8">
                          <li className="flex items-center gap-3 text-purple-200"><div className="w-2 h-2 bg-purple-500 rounded-full"></div>Custom Workflows</li>
                          <li className="flex items-center gap-3 text-purple-200"><div className="w-2 h-2 bg-purple-500 rounded-full"></div>API Access</li>
                          <li className="flex items-center gap-3 text-purple-200"><div className="w-2 h-2 bg-purple-500 rounded-full"></div>White Labeling</li>
                      </ul>
                      <button className="text-purple-400 font-bold uppercase tracking-widest text-sm hover:text-white transition-colors flex items-center gap-2">View Case Study <OwnerIcon name="ArrowRightIcon" className="w-4 h-4"/></button>
                  </div>
              </div>
          </div>
      </section>

      {/* --- INTEGRATION GALAXY (NEW) --- */}
      <section className="py-32 px-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-[#080810]"></div>
          {/* Orbits */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-white/5 rounded-full"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] border border-white/5 rounded-full"></div>
          
          <div className="relative z-10 max-w-4xl mx-auto text-center">
              <div className="mb-12">
                  <h2 className="text-3xl font-black text-white mb-4">Universal Compatibility</h2>
                  <p className="text-gray-400">Connects seamlessly with the tools you already use.</p>
              </div>
              
              <div className="h-[400px] relative flex items-center justify-center">
                  {/* Core */}
                  <div className="w-24 h-24 bg-gradient-to-r from-gyn-blue-dark to-black rounded-full border-2 border-white/20 flex items-center justify-center shadow-[0_0_50px_rgba(48,65,199,0.5)] relative z-20">
                      <OwnerIcon name="StudioIcon3D" className="w-10 h-10" />
                  </div>
                  
                  {/* Orbiting Icons (Simulated) */}
                  <div className="absolute top-1/4 left-1/4 bg-white/10 p-3 rounded-xl backdrop-blur-md border border-white/20"><span className="font-bold text-xs">Google</span></div>
                  <div className="absolute bottom-1/4 right-1/4 bg-white/10 p-3 rounded-xl backdrop-blur-md border border-white/20"><span className="font-bold text-xs">Stripe</span></div>
                  <div className="absolute top-1/3 right-1/4 bg-white/10 p-3 rounded-xl backdrop-blur-md border border-white/20"><span className="font-bold text-xs">Slack</span></div>
                  <div className="absolute bottom-1/3 left-1/4 bg-white/10 p-3 rounded-xl backdrop-blur-md border border-white/20"><span className="font-bold text-xs">Zoom</span></div>
              </div>
          </div>
      </section>

      {/* --- PRICING TIERS --- */}
      <section className="py-10 px-4">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-[#0f1016] rounded-[30px] p-8 border border-white/10 hover:border-white/30 transition-all hover:-translate-y-2 shadow-2xl relative group">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-gray-500 to-transparent"></div>
                  <h3 className="text-2xl font-bold text-white mb-2">Starter</h3>
                  <div className="text-4xl font-black text-white mb-6">$0 <span className="text-sm font-normal text-gray-500">/ mo</span></div>
                  <p className="text-sm text-gray-400 mb-8">Perfect for individuals and freelancers getting started.</p>
                  <ul className="space-y-4 mb-8 text-sm text-gray-300">
                      {['Personal Dashboard', 'Basic Creator Studio', 'Marketplace Access', 'Community Support'].map(feat => (<li key={feat} className="flex items-center gap-3"><OwnerIcon name="CheckCircleIcon" className="w-4 h-4 text-gray-500" />{feat}</li>))}
                  </ul>
                  <button className="w-full py-3 rounded-xl border border-white/20 font-bold hover:bg-white hover:text-black transition-colors">Get Started</button>
              </div>
              <div className="bg-[#151621] rounded-[30px] p-8 border border-gyn-blue-medium shadow-[0_0_40px_rgba(48,65,199,0.2)] relative transform md:-translate-y-4 z-10">
                  <div className="absolute top-0 right-0 bg-gyn-blue-medium text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-widest">Most Popular</div>
                  <h3 className="text-2xl font-bold text-gyn-blue-light mb-2">Growth</h3>
                  <div className="text-4xl font-black text-white mb-6">$49 <span className="text-sm font-normal text-gray-500">/ mo</span></div>
                  <p className="text-sm text-gray-400 mb-8">For growing schools and professional creators.</p>
                  <ul className="space-y-4 mb-8 text-sm text-gray-200">
                      {['Everything in Starter', 'Full Tenant Management', 'Advanced Analytics', 'Concierge AI (Standard)', 'Priority Support'].map(feat => (<li key={feat} className="flex items-center gap-3"><OwnerIcon name="CheckCircleIcon" className="w-4 h-4 text-gyn-blue-medium" />{feat}</li>))}
                  </ul>
                  <button className="w-full py-3 rounded-xl bg-gyn-blue-medium text-white font-bold hover:bg-blue-600 transition-colors shadow-lg shadow-blue-900/50">Upgrade Now</button>
              </div>
              <div className="bg-[#0f1016] rounded-[30px] p-8 border border-white/10 hover:border-gyn-orange/50 transition-all hover:-translate-y-2 shadow-2xl relative group">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-gyn-orange to-transparent"></div>
                  <h3 className="text-2xl font-bold text-white mb-2">Enterprise</h3>
                  <div className="text-4xl font-black text-white mb-6">Custom</div>
                  <p className="text-sm text-gray-400 mb-8">For large institutions requiring full control.</p>
                  <ul className="space-y-4 mb-8 text-sm text-gray-300">
                      {['Unlimited Users', 'Custom Integrations', 'Concierge AI (Uncapped)', 'Dedicated Success Manager', 'White Labeling'].map(feat => (<li key={feat} className="flex items-center gap-3"><OwnerIcon name="CheckCircleIcon" className="w-4 h-4 text-gyn-orange" />{feat}</li>))}
                  </ul>
                  <button className="w-full py-3 rounded-xl border border-white/20 font-bold hover:bg-gyn-orange hover:text-white hover:border-gyn-orange transition-colors">Contact Sales</button>
              </div>
          </div>
      </section>

      {/* --- CUSTOM DEV BLOCK --- */}
      <section className="py-20 px-4 bg-[#080810]">
          <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                  <div>
                      <h2 className="text-3xl font-bold text-white mb-6">Custom Development</h2>
                      <p className="text-gray-400 leading-relaxed mb-6">Need something unique? Our team of architectural engineers can build custom modules on top of the Grow Your Need OS. From specialized learning tools to complex financial integrations.</p>
                      <a href="#" className="text-gyn-blue-medium font-bold hover:text-white transition-colors flex items-center gap-2">Explore Solutions <OwnerIcon name="ArrowRightIcon" className="w-4 h-4" /></a>
                  </div>
                  <div className="h-64 bg-gradient-to-br from-gray-800 to-black rounded-2xl border border-white/10 flex items-center justify-center relative overflow-hidden group">
                      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10"></div>
                      <OwnerIcon name="CommandLineIcon" className="w-24 h-24 text-gray-700 group-hover:text-white transition-colors duration-500" />
                  </div>
              </div>
          </div>
      </section>

      <LandingFooter />
    </div>
  );
};

export default OurServices;
