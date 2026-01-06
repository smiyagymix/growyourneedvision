
import React, { useState, CSSProperties } from 'react';

interface SmartGlassPaneProps {
  children: React.ReactNode;
  className?: string;
  interactive?: boolean;
  style?: CSSProperties;
}

export const SmartGlassPane: React.FC<SmartGlassPaneProps> = ({ children, className = '', interactive = false, style }) => {
  return (
    <div 
      className={`bg-deepBlue/20 backdrop-blur-lg border border-brushedTitanium/30 rounded-xl shadow-glass-edge p-6 md:p-8 ${interactive ? 'transition-all duration-300 hover:border-vibrantTeal/70 hover:shadow-[0_0_25px_0px_rgba(0,169,157,0.3)]' : ''} ${className}`}
      style={style}
    >
      {children}
    </div>
  );
};

interface SiliconeButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
  glowColor?: 'orange' | 'teal';
}

export const SiliconeButton: React.FC<SiliconeButtonProps> = ({ children, className = '', glowColor, ...props }) => {
  let glowClasses = '';
  if (glowColor === 'orange') {
    glowClasses = 'hover:shadow-[0_0_15px_2px_rgba(243,112,33,0.6)] active:shadow-[0_0_15px_2px_rgba(243,112,33,0.6)]';
  } else if (glowColor === 'teal') {
    glowClasses = 'hover:shadow-[0_0_15px_2px_rgba(0,169,157,0.6)] active:shadow-[0_0_15px_2px_rgba(0,169,157,0.6)]';
  }

  return (
    <button
      className={`bg-matteSilicone text-white font-machina py-3 px-6 rounded-lg shadow-silicone-idle 
                 hover:bg-gray-600 active:bg-gray-800 active:shadow-silicone-depressed active:scale-[0.98]
                 transform transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-carbonFiberBase focus:ring-vibrantTeal ${glowClasses} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export const HolographicGlowButton: React.FC<SiliconeButtonProps> = ({ children, className = '', ...props }) => {
  return (
    <button
      className={`relative font-machina text-white py-3 px-8 rounded-lg bg-energeticOrange/80
                 shadow-[0_0_10px_0px_rgba(243,112,33,0.5)] 
                 hover:bg-energeticOrange
                 active:scale-[0.98]
                 transform transition-all duration-200 ease-in-out 
                 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-carbonFiberBase focus:ring-energeticOrange
                 overflow-hidden group ${className}`}
      {...props}
    >
      <span className="absolute inset-0 animate-pulseGlow opacity-70 group-hover:opacity-100 transition-opacity duration-300"></span>
      <span className="relative z-10">{children}</span>
    </button>
  );
};


interface ProjectedTextProps {
  children: React.ReactNode;
  className?: string;
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span';
}

export const ProjectedText: React.FC<ProjectedTextProps> = ({ children, className = '', as = 'h1' }) => {
  const Tag = as;
  return (
    <Tag className={`font-machina text-gray-100 animate-subtleFlicker tracking-wider ${className}`} style={{textShadow: '0 0 5px rgba(220, 220, 255, 0.3), 0 0 10px rgba(0, 169, 157, 0.2)'}}>
      {children}
    </Tag>
  );
};

interface TitaniumButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
}

export const TitaniumButton: React.FC<TitaniumButtonProps> = ({ children, className = '', icon, ...props }) => {
  return (
    <button
      className={`bg-brushedTitanium text-gray-200 font-machina py-2 px-4 rounded-md shadow-titanium-plate
                 hover:bg-gray-500 hover:shadow-[0_0_10px_1px_rgba(0,169,157,0.4)]
                 active:bg-darkTitanium active:scale-[0.99]
                 transform transition-all duration-150 ease-in-out
                 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-carbonFiberBase focus:ring-vibrantTeal
                 flex items-center justify-center space-x-2 ${className}`}
      {...props}
    >
      {icon && <span className="w-5 h-5">{icon}</span>}
      <span>{children}</span>
    </button>
  );
};

// Example Icon (can be expanded with more Heroicons or custom SVGs)
export const UserGroupIcon: React.FC<{className?: string}> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 ${className}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-3.741-5.602m-10.995 0A3 3 0 0 1 2.25 12.62a3 3 0 0 1 3.741 5.601m5.254-4.425a2.25 2.25 0 0 1 3.004 0M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
  </svg>
);

export const ChartBarIcon: React.FC<{className?: string}> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 ${className}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
  </svg>
);

export const CogIcon: React.FC<{className?: string}> = ({ className }) => (
 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 ${className}`}>
  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12a7.5 7.5 0 0 0 15 0m-15 0a7.5 7.5 0 1 1 15 0m-15 0H3m16.5 0H21m-1.5 0H12m0 0V9m0 3V6m0 3v6m7.5-3H12m7.5 0H15m0 0V9m0 3v6m0-3a3 3 0 1 0-6 0 3 3 0 0 0 6 0Zm-3-3H9m6 0H15" />
</svg>
);

export const AcademicCapIcon: React.FC<{className?: string}> = ({className}) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 ${className}`}>
    <path d="M12 14.25L3.873 9.75M12 14.25L20.127 9.75M12 14.25V21M12 3L20.127 7.5M12 3L3.873 7.5M12 3V9.75M20.127 7.5L12 12L3.873 7.5M20.127 7.5V14.25" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21L3 16.5V7.5L12 3L21 7.5V16.5L12 21Z" />
  </svg>
);

export const ServerIcon: React.FC<{className?: string}> = ({className}) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 ${className}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 14.25h13.5m-13.5 0a3 3 0 01-3-3V7.5a3 3 0 013-3h13.5a3 3 0 013 3v3.75a3 3 0 01-3 3m-13.5 0M5.25 14.25v3.75a3 3 0 003 3h7.5a3 3 0 003-3v-3.75M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

export const ChevronRightIcon: React.FC<{className?: string}> = ({className}) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 ${className}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
  </svg>
);

export const GoogleIcon: React.FC<{className?: string}> = ({ className }) => (
  <svg className={`w-5 h-5 ${className}`} viewBox="0 0 24 24" fill="currentColor">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

export const MicrosoftIcon: React.FC<{className?: string}> = ({ className }) => (
 <svg className={`w-5 h-5 ${className}`} viewBox="0 0 23 23" fill="currentColor">
  <path fill="#f3f3f3" d="M1 1h21v21H1z"/>
  <path fill="#F25022" d="M1 1h10v10H1z"/>
  <path fill="#00A4EF" d="M1 12h10v10H1z"/>
  <path fill="#7FBA00" d="M12 1h10v10H12z"/>
  <path fill="#FFB900" d="M12 12h10v10H12z"/>
 </svg>
);

// Placeholder for Data Sphere (can be an animated SVG)
export const AnimatedDataSphere: React.FC<{className?: string}> = ({ className }) => (
  <div className={`relative w-64 h-64 md:w-80 md:h-80 ${className}`}>
    <svg viewBox="0 0 200 200" className="w-full h-full">
      {/* Outer Orbitals */}
      {[...Array(3)].map((_, i) => (
        <circle key={`orbit-${i}`} cx="100" cy="100" r={60 + i * 15} fill="none" stroke="rgba(0,169,157,0.3)" strokeWidth="1">
          <animateTransform attributeName="transform" type="rotate" from="0 100 100" to="360 100 100" dur={`${15 + i*5}s`} repeatCount="indefinite" />
        </circle>
      ))}
      {/* Central Core */}
      <circle cx="100" cy="100" r="40" fill="url(#coreGradient)" />
      <defs>
        <radialGradient id="coreGradient">
          <stop offset="0%" stopColor="rgba(0,169,157,0.8)" />
          <stop offset="100%" stopColor="rgba(0,90,156,0.5)" />
        </radialGradient>
      </defs>
      {/* Nodes */}
      {[...Array(5)].map((_, i) => {
        const angle = (i / 5) * 2 * Math.PI;
        const rOrbit = 70;
        const x = 100 + rOrbit * Math.cos(angle);
        const y = 100 + rOrbit * Math.sin(angle);
        return (
          <circle key={`node-${i}`} cx={x} cy={y} r="5" fill="rgba(243,112,33,0.8)" className="animate-pulse" style={{animationDelay: `${i*0.2}s`}}>
             <animateTransform attributeName="transform" type="rotate" from="0 100 100" to="360 100 100" dur="18s" repeatCount="indefinite" />
          </circle>
        );
      })}
    </svg>
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <AcademicCapIcon className="w-10 h-10 text-vibrantTeal opacity-70" />
    </div>
  </div>
);

// Placeholder for cracked glass effect
export const CrackedGlassEffect: React.FC = () => (
  <svg width="100%" height="100%" className="absolute inset-0 pointer-events-none opacity-60"
    xmlns="http://www.w3.org/2000/svg" >
    <defs>
      <pattern id="cracks" patternUnits="userSpaceOnUse" width="100" height="100">
        <path d="M0 50 L20 30 L40 50 L50 40 L60 60 L80 40 L100 60 M50 0 L40 20 L60 30 L50 50 L70 70 L50 100 M0 0 L100 100 M0 100 L100 0" 
              stroke="rgba(200,200,220,0.2)" strokeWidth="1" fill="none"/>
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#cracks)" />
  </svg>
);
