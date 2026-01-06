
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { OwnerIcon } from '../shared/OwnerIcons';

const LandingFooter: React.FC = () => {
  const navigate = useNavigate();

  const footerLinks = {
    Product: [
      { label: 'Features', path: '/features' },
      { label: 'Enterprise', path: '/enterprise' },
      { label: 'Security', path: '/security' },
      { label: 'Changelog', path: '/changelog' },
      { label: 'Resources', path: '/resources' },
    ],
    Platform: [
      { label: 'Documentation', path: '/docs' },
      { label: 'API Reference', path: '/api' },
      { label: 'System Status', path: '/status' },
      { label: 'Community', path: '/community' },
      { label: 'Help Center', path: '/help' },
    ],
    Company: [
      { label: 'About', path: '/features' },
      { label: 'Careers', path: '/features' }, // Placeholder
      { label: 'Contact', path: '/contact' },
      { label: 'Partners', path: '/enterprise' },
    ],
    Legal: [
      { label: 'Privacy Policy', path: '/' },
      { label: 'Terms of Service', path: '/' },
      { label: 'Cookie Policy', path: '/' },
      { label: 'Acceptable Use', path: '/' },
    ]
  };

  return (
    <footer className="relative bg-[#020205] pt-16 pb-8 overflow-hidden border-t border-white/5">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 mix-blend-soft-light pointer-events-none"></div>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[1px] bg-gradient-to-r from-transparent via-gyn-blue-medium/50 to-transparent shadow-[0_0_20px_rgba(48,65,199,0.5)]"></div>
      <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-gyn-blue-dark/20 blur-[100px] rounded-full pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-8 mb-10">
          
          {/* Brand Column */}
          <div className="lg:col-span-4 space-y-8">
            <div className="flex items-center gap-3 group cursor-pointer" onClick={() => navigate('/')}>
              <div className="w-12 h-12 bg-gradient-to-br from-white/10 to-black rounded-xl border border-white/10 flex items-center justify-center shadow-2xl group-hover:border-gyn-orange/50 transition-colors">
                 <OwnerIcon name="StudioIcon3D" className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-machina font-black text-white tracking-wide">GROW YOUR NEED</h2>
                <p className="text-[10px] text-gray-500 font-mono tracking-[0.2em] uppercase">OS v2.4.0 // STABLE</p>
              </div>
            </div>
            
            <p className="text-gray-400 leading-relaxed text-sm max-w-sm">
              The world's first unified operating system for education and enterprise. 
              Replacing fragmentation with a single, neural interface.
            </p>

            <div className="flex gap-4">
              {['Twitter', 'GitHub', 'Discord', 'LinkedIn'].map((social, i) => (
                <button key={social} className="w-10 h-10 rounded-full bg-white text-black border border-white/10 flex items-center justify-center hover:bg-gray-200 hover:scale-110 transition-all duration-300 group">
                   {/* Simple shapes for social icons */}
                   <div className="w-4 h-4 bg-current mask-icon"></div> 
                   {/* Using generic icons for now since we don't have social icons in OwnerIcons */}
                   <OwnerIcon name={social === 'GitHub' ? 'CodeBracketIcon' : social === 'Discord' ? 'ChatBubbleLeftRight' : 'GlobeAltIcon'} className="w-4 h-4" />
                </button>
              ))}
            </div>
          </div>

          {/* Links Columns */}
          <div className="lg:col-span-5 grid grid-cols-2 md:grid-cols-3 gap-8">
            {Object.entries(footerLinks).map(([category, links]) => (
              <div key={category}>
                <h4 className="font-machina text-xs font-bold text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                  <span className="w-1 h-1 bg-gyn-orange rounded-full"></span>
                  {category}
                </h4>
                <ul className="space-y-3">
                  {links.map((link) => (
                    <li key={link.label}>
                      <button 
                        onClick={() => navigate(link.path)}
                        className="text-sm text-gray-500 hover:text-white transition-colors hover:translate-x-1 duration-300 flex items-center gap-1 group"
                      >
                        {link.label}
                        <span className="opacity-0 group-hover:opacity-100 text-[8px] transition-opacity text-gyn-blue-medium">↗</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Newsletter / CTA Column */}
          <div className="lg:col-span-3 space-y-6">
            <h4 className="font-machina text-xs font-bold text-white uppercase tracking-widest mb-6">System Updates</h4>
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-gyn-blue-medium to-gyn-orange rounded-xl blur opacity-20 group-hover:opacity-50 transition duration-500"></div>
              <div className="relative bg-black border border-white/10 rounded-xl p-1 flex items-center">
                <input 
                  type="email" 
                  placeholder="Enter secure email..." 
                  className="bg-transparent border-none text-white text-sm px-4 w-full focus:ring-0 placeholder-gray-600"
                />
                <button className="bg-white text-black px-4 py-2 rounded-lg font-bold text-xs hover:bg-gray-200 transition-colors uppercase tracking-wider">
                  Join
                </button>
              </div>
            </div>
            <p className="text-[10px] text-gray-600">
              Subscribe to the developer stream. Zero spam. Only architecture updates and critical patches.
            </p>
            
            {/* Status Indicator */}
            <div 
              className="mt-8 inline-flex items-center gap-3 px-4 py-2 rounded-full border border-green-900/50 bg-green-900/10 cursor-pointer hover:bg-green-900/20 transition-colors"
              onClick={() => navigate('/status')}
            >
              <div className="relative">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="w-2 h-2 bg-green-500 rounded-full absolute inset-0 animate-ping"></div>
              </div>
              <span className="text-xs font-mono text-green-400">All Systems Operational</span>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-[10px] text-gray-600 font-mono uppercase tracking-wider">
            © 2024 Grow Your Need Inc. // EST. 2023
          </div>
          <div className="flex items-center gap-6">
             <span className="text-[10px] text-gray-700 font-mono">SAN FRANCISCO</span>
             <span className="text-[10px] text-gray-700 font-mono">TOKYO</span>
             <span className="text-[10px] text-gray-700 font-mono">LONDON</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default LandingFooter;
