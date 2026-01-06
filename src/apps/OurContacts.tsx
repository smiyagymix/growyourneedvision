
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { OwnerIcon } from '../components/shared/OwnerIcons';
import LandingFooter from '../components/layout/LandingFooter';

const OurContacts: React.FC = () => {
  const navigate = useNavigate();

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

      <div className="pt-40 pb-20 px-4 max-w-7xl mx-auto flex flex-col md:flex-row gap-12 items-start">
          
          {/* Left: Contact Form */}
          <div className="flex-1 w-full">
              <h1 className="text-5xl font-black text-white mb-2">GET IN <span className="text-gyn-orange">TOUCH</span></h1>
              <p className="text-gray-400 mb-10 text-lg">We are ready to initialize your ecosystem.</p>
              
              <form className="space-y-6 bg-[#0f1016] p-8 rounded-[30px] border border-white/10 shadow-2xl relative overflow-hidden group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-gyn-orange to-purple-600 opacity-20 blur-xl group-hover:opacity-30 transition-opacity duration-1000"></div>
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none relative z-10"></div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                      <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Full Name</label>
                          <input type="text" className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white focus:border-gyn-blue-medium focus:ring-1 focus:ring-gyn-blue-medium transition-all outline-none" placeholder="John Doe" />
                      </div>
                      <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Email Address</label>
                          <input type="email" className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white focus:border-gyn-blue-medium focus:ring-1 focus:ring-gyn-blue-medium transition-all outline-none" placeholder="john@company.com" />
                      </div>
                  </div>
                  
                  <div className="space-y-2 relative z-10">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Subject</label>
                      <select className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white focus:border-gyn-blue-medium focus:ring-1 focus:ring-gyn-blue-medium transition-all outline-none appearance-none">
                          <option>General Inquiry</option>
                          <option>Sales / Enterprise</option>
                          <option>Technical Support</option>
                          <option>Partnership</option>
                      </select>
                  </div>

                  <div className="space-y-2 relative z-10">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Message</label>
                      <textarea className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white h-32 focus:border-gyn-blue-medium focus:ring-1 focus:ring-gyn-blue-medium transition-all outline-none resize-none" placeholder="How can we help you grow?"></textarea>
                  </div>

                  <button className="relative z-10 w-full py-4 bg-gradient-to-r from-gyn-blue-dark to-gyn-blue-medium rounded-xl font-black uppercase tracking-widest text-sm hover:shadow-[0_0_20px_rgba(48,65,199,0.5)] transition-all active:scale-95 flex items-center justify-center gap-3">
                      <OwnerIcon name="PaperAirplane" className="w-5 h-5" /> Transmit Message
                  </button>
              </form>
          </div>

          {/* Right: Network Status & Info */}
          <div className="w-full md:w-[400px] space-y-8">
              <div className="bg-[#0f1016] rounded-2xl border border-white/10 overflow-hidden p-6 relative">
                  <div className="flex items-center justify-between mb-6">
                      <h3 className="font-bold text-white flex items-center gap-2"><span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>System Status</h3>
                      <span className="text-xs font-mono text-green-500">OPERATIONAL</span>
                  </div>
                  <div className="space-y-4">
                      {[
                          { label: "Support Grid", status: "99.9%", color: "bg-green-500" },
                          { label: "Sales Uplink", status: "Active", color: "bg-blue-500" },
                          { label: "Response Time", status: "< 15ms", color: "bg-purple-500" },
                      ].map((item, i) => (
                          <div key={i} className="flex items-center justify-between text-sm">
                              <span className="text-gray-400">{item.label}</span>
                              <div className="flex items-center gap-2"><div className={`w-1.5 h-1.5 rounded-full ${item.color}`}></div><span className="font-mono text-white">{item.status}</span></div>
                          </div>
                      ))}
                  </div>
                  <div className="mt-6 h-16 flex items-end gap-1 opacity-50">
                      {[40, 60, 35, 80, 50, 70, 90, 60, 45, 75].map((h, i) => (<div key={i} className="flex-1 bg-gyn-blue-medium/50 rounded-t-sm" style={{height: `${h}%`}}></div>))}
                  </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                  <div className="bg-[#0f1016] p-6 rounded-2xl border border-white/10 flex items-center gap-4 group hover:border-white/30 transition-colors">
                      <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center text-gyn-orange group-hover:scale-110 transition-transform"><OwnerIcon name="MapPinIcon" className="w-6 h-6" /></div>
                      <div><h3 className="font-bold text-white">Global HQ</h3><p className="text-sm text-gray-400">123 Future Blvd, Tech City, NY</p></div>
                  </div>
                  <div className="bg-[#0f1016] p-6 rounded-2xl border border-white/10 flex items-center gap-4 group hover:border-white/30 transition-colors">
                      <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform"><OwnerIcon name="Envelope" className="w-6 h-6" /></div>
                      <div><h3 className="font-bold text-white">Email Us</h3><p className="text-sm text-gray-400">support@growyourneed.com</p></div>
                  </div>
              </div>

              <div className="h-64 bg-[#0a0a12] rounded-[30px] border border-white/10 relative overflow-hidden flex items-center justify-center group">
                  <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10"></div>
                  <div className="w-full h-full opacity-50 grayscale group-hover:grayscale-0 transition-all duration-700" style={{backgroundImage: 'radial-gradient(circle at 50% 50%, #1d2a78 0%, transparent 70%)'}}></div>
                  <div className="absolute top-1/3 left-1/3 w-2 h-2 bg-white rounded-full animate-ping"></div>
                  <div className="absolute top-1/2 right-1/4 w-2 h-2 bg-white rounded-full animate-ping delay-700"></div>
                  <div className="absolute bottom-1/3 left-1/2 w-2 h-2 bg-white rounded-full animate-ping delay-300"></div>
                  <div className="absolute z-10 text-center backdrop-blur-sm bg-black/30 p-4 rounded-xl border border-white/10">
                      <OwnerIcon name="GlobeAltIcon" className="w-12 h-12 text-white/80 mx-auto mb-2" />
                      <span className="text-xs font-bold text-white uppercase tracking-widest">Global Presence</span>
                      <div className="text-[10px] text-gyn-orange font-mono mt-1">14 DATA CENTERS</div>
                  </div>
              </div>
          </div>
      </div>

      {/* --- FAQ BLOCK (NEW) --- */}
      <section className="py-20 px-4 bg-[#080910] border-t border-white/10">
          <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold text-white mb-8 text-center">Frequently Requested Protocols</h2>
              <div className="space-y-4">
                  {['How do I migrate my existing school data?', 'Is the AI compliant with privacy laws?', 'Can I build custom modules?', 'What happens if I need more storage?'].map((q, i) => (
                      <div key={i} className="bg-[#0f1016] border border-white/10 rounded-xl p-6 cursor-pointer hover:border-gyn-blue-medium/50 transition-all group">
                          <div className="flex justify-between items-center">
                              <span className="font-medium text-gray-300 group-hover:text-white transition-colors">{q}</span>
                              <OwnerIcon name="ChevronRight" className="w-4 h-4 text-gray-500 group-hover:text-gyn-blue-medium" />
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      </section>

      <LandingFooter />
    </div>
  );
};

export default OurContacts;
