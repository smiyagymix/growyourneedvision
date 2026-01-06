import React from 'react';

export type IconName = string;

interface IconProps {
  className?: string;
  name: IconName;
}

export const OwnerIcon: React.FC<IconProps> = ({ className, name }) => {
  const sizeClass = className || "w-6 h-6";

  const icons: Record<string, React.ReactNode> = {
    // ==========================================
    // AUTHENTICATION ILLUSTRATIONS (Large 3D)
    // ==========================================
    
    // 3D Key & Lock (Login)
    AuthLogin3D: (
      <g filter="drop-shadow(0 20px 30px rgba(0,0,0,0.3))">
         <defs>
             <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                 <stop offset="0%" stopColor="#FFD700" />
                 <stop offset="50%" stopColor="#FDB931" />
                 <stop offset="100%" stopColor="#C49102" />
             </linearGradient>
             <linearGradient id="silverGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                 <stop offset="0%" stopColor="#E0E0E0" />
                 <stop offset="100%" stopColor="#757575" />
             </linearGradient>
         </defs>
         {/* Shield Backing */}
         <path d="M12 2 L22 7 V12 C22 17 17 21 12 22 C7 21 2 17 2 12 V7 L12 2Z" fill="#1d2a78" stroke="url(#silverGrad)" strokeWidth="0.5" opacity="0.9" transform="scale(0.8) translate(3,3)" />
         
         {/* The Key */}
         <g transform="translate(4, 4) rotate(-45 12 12)">
             <circle cx="8" cy="8" r="4" fill="none" stroke="url(#goldGrad)" strokeWidth="2.5" />
             <path d="M11 11 L19 19 M19 19 L19 22 M16 16 L16 19" stroke="url(#goldGrad)" strokeWidth="2.5" strokeLinecap="round" />
         </g>
         
         {/* Glow */}
         <circle cx="12" cy="12" r="8" fill="url(#goldGrad)" opacity="0.2" filter="blur(5px)" />
      </g>
    ),

    // 3D User Card (Registration)
    AuthSignup3D: (
      <g filter="drop-shadow(0 20px 30px rgba(0,0,0,0.3))">
          <defs>
              <linearGradient id="cardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="100%" stopColor="#eef2f6" />
              </linearGradient>
          </defs>
          {/* Floating Card */}
          <rect x="4" y="4" width="16" height="12" rx="2" fill="url(#cardGrad)" stroke="#cbd5e1" strokeWidth="0.5" transform="rotate(-5 12 12)" />
          <rect x="4" y="8" width="16" height="12" rx="2" fill="#3041c7" stroke="#1d2a78" strokeWidth="0.5" transform="rotate(5 12 12)" />
          
          {/* Avatar on Card */}
          <circle cx="12" cy="12" r="3" fill="#f5a623" transform="rotate(5 12 12)" />
          <path d="M9 16 Q12 18 15 16" stroke="white" strokeWidth="1" strokeLinecap="round" transform="rotate(5 12 12)" />
          
          {/* Floating Plus */}
          <circle cx="18" cy="6" r="3" fill="#4CAF50" />
          <path d="M18 4 V8 M16 6 H20" stroke="white" strokeWidth="1.5" />
      </g>
    ),

    // 3D Lock/Mail (Forgot Password)
    AuthForgot3D: (
      <g filter="drop-shadow(0 20px 30px rgba(0,0,0,0.3))">
          <path d="M2 8 L12 16 L22 8 V20 C22 21 21 22 20 22 H4 C3 22 2 21 2 20 V8 Z" fill="#e9eaff" stroke="#3041c7" strokeWidth="0.5" />
          <path d="M2 8 L12 2 L22 8" fill="#dbeafe" stroke="#3041c7" strokeWidth="0.5" />
          <circle cx="12" cy="12" r="4" fill="#f5a623" />
          <text x="12" y="16" fontSize="5" fontWeight="bold" fill="white" textAnchor="middle">?</text>
      </g>
    ),

    // 3D Reset (Change Password)
    AuthReset3D: (
      <g filter="drop-shadow(0 20px 30px rgba(0,0,0,0.3))">
          <circle cx="12" cy="12" r="8" fill="none" stroke="#3041c7" strokeWidth="2.5" strokeDasharray="30 15" transform="rotate(45 12 12)" />
          <path d="M12 7 V12 L15 15" stroke="#f5a623" strokeWidth="2" strokeLinecap="round" />
          <rect x="9" y="9" width="6" height="5" rx="1" fill="#1d2a78" />
          <path d="M10 9 V7 A2 2 0 0 1 14 7 V9" fill="none" stroke="#1d2a78" strokeWidth="1.5" />
      </g>
    ),

    // 3D House (Dashboard)
    Home: (
      <g>
        <defs>
          <linearGradient id="roofGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#4A90E2" />
            <stop offset="50%" stopColor="#005A9C" />
            <stop offset="100%" stopColor="#003366" />
          </linearGradient>
          <linearGradient id="doorGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFD700" />
            <stop offset="100%" stopColor="#DAA520" />
          </linearGradient>
          <filter id="dropShadow" height="130%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="1"/> 
            <feOffset dx="0" dy="1" result="offsetblur"/> 
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.3"/>
            </feComponentTransfer>
            <feMerge> 
              <feMergeNode/>
              <feMergeNode in="SourceGraphic"/> 
            </feMerge>
          </filter>
        </defs>
        <g filter="url(#dropShadow)">
           <path d="M12 2 L22 11 H19 V21 C19 21.5 18.5 22 18 22 H6 C5.5 22 5 21.5 5 21 V11 H2 L12 2Z" fill="#F0F4F8" />
           <path d="M12 1.5 L23 11.5 L21.5 13 L12 4.5 L2.5 13 L1 11.5 L12 1.5Z" fill="url(#roofGrad)" stroke="#003366" strokeWidth="0.5"/>
           <rect x="10" y="14" width="4" height="8" rx="0.5" fill="url(#doorGrad)" />
           <circle cx="13" cy="18" r="0.5" fill="#5c4002" />
        </g>
      </g>
    ),

    // 3D Graduation Cap (Tenant Mgt)
    GraduationCap: (
      <g>
        <defs>
          <linearGradient id="capTop" x1="0%" y1="0%" x2="100%" y2="50%">
            <stop offset="0%" stopColor="#4a4a4a" />
            <stop offset="50%" stopColor="#2d2d2d" />
            <stop offset="100%" stopColor="#1a1a1a" />
          </linearGradient>
          <linearGradient id="tasselGold" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FFD700" />
            <stop offset="100%" stopColor="#B8860B" />
          </linearGradient>
        </defs>
        <filter id="shadowCap">
            <feDropShadow dx="0" dy="2" stdDeviation="1.5" floodOpacity="0.5"/>
        </filter>
        <g filter="url(#shadowCap)">
            <path d="M12 3 L22 8 L12 13 L2 8 Z" fill="url(#capTop)" stroke="#555" strokeWidth="0.5"/>
            <path d="M22 8 V11 C22 13.5 17.5 15.5 12 15.5 C6.5 15.5 2 13.5 2 11 V8" fill="#2d2d2d" opacity="0.9"/>
            <circle cx="12" cy="8" r="1.5" fill="#444" />
            <path d="M12 8 L20 12 V18" stroke="url(#tasselGold)" strokeWidth="1.5" fill="none"/>
            <circle cx="20" cy="18" r="1.5" fill="#DAA520" />
        </g>
      </g>
    ),

    // 3D Calculator (CRM)
    Calculator: (
      <g>
        <rect x="5" y="2" width="14" height="20" rx="2" fill="#263238" stroke="#102027" strokeWidth="0.5" filter="drop-shadow(2px 2px 2px rgba(0,0,0,0.4))" />
        <rect x="7" y="5" width="10" height="4" rx="0.5" fill="#CFD8DC" />
        <circle cx="8" cy="12" r="1.5" fill="#78909C" /> <circle cx="12" cy="12" r="1.5" fill="#78909C" /> <circle cx="16" cy="12" r="1.5" fill="#FF7043" />
        <circle cx="8" cy="15.5" r="1.5" fill="#78909C" /> <circle cx="12" cy="15.5" r="1.5" fill="#78909C" /> <circle cx="16" cy="15.5" r="1.5" fill="#FFB74D" />
        <circle cx="8" cy="19" r="1.5" fill="#78909C" /> <circle cx="12" cy="19" r="1.5" fill="#78909C" /> <circle cx="16" cy="19" r="1.5" fill="#4CAF50" />
      </g>
    ),

    // 3D Briefcase (Tool-Platform)
    Briefcase: (
      <g>
        <defs>
          <linearGradient id="leather" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#795548" />
            <stop offset="100%" stopColor="#3E2723" />
          </linearGradient>
          <linearGradient id="metal" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E0E0E0" />
            <stop offset="50%" stopColor="#9E9E9E" />
            <stop offset="100%" stopColor="#616161" />
          </linearGradient>
        </defs>
        <path d="M8 2 H16 V6 H8 Z" fill="none" stroke="url(#metal)" strokeWidth="2" />
        <rect x="2" y="6" width="20" height="15" rx="2" fill="url(#leather)" stroke="#3E2723" strokeWidth="0.5" filter="drop-shadow(0 2px 3px rgba(0,0,0,0.5))" />
        <rect x="2" y="6" width="20" height="5" rx="1" fill="#8D6E63" opacity="0.3" />
        <rect x="5" y="6" width="2" height="4" fill="url(#metal)" />
        <rect x="17" y="6" width="2" height="4" fill="url(#metal)" />
        <rect x="10" y="11" width="4" height="2" rx="0.5" fill="url(#metal)" />
      </g>
    ),

    // 3D Chat Bubbles (Communication)
    ChatBubbleLeftRight: (
      <g filter="drop-shadow(0 2px 3px rgba(0,0,0,0.3))">
        <path d="M2 10 C2 6 5 3 10 3 H12 C16 3 19 6 19 10 V14 C19 16 17 18 14 18 H6 L2 22 V10" fill="#42A5F5" stroke="#1E88E5" strokeWidth="0.5"/>
        <path d="M22 14 C22 10 19 7 14 7 H12 C8 7 5 10 5 14 V18 C5 20 7 22 10 22 H18 L22 26 V14" fill="#66BB6A" stroke="#43A047" strokeWidth="0.5" transform="translate(1, -1)"/>
      </g>
    ),

    // 3D Sparkles (Concierge AI)
    Sparkles: (
      <g>
        <path d="M12 2 L14 8 L20 10 L14 12 L12 18 L10 12 L4 10 L10 8 Z" fill="#FFEB3B" stroke="#FBC02D" strokeWidth="0.5" filter="drop-shadow(0 0 5px #FFEB3B)"/>
        <path d="M19 16 L20 19 L23 20 L20 21 L19 24 L18 21 L15 20 L18 19 Z" fill="#80DEEA" stroke="#00BCD4" strokeWidth="0.2" filter="drop-shadow(0 0 3px #80DEEA)"/>
        <path d="M5 18 L6 20 L8 21 L6 22 L5 24 L4 22 L2 21 L4 20 Z" fill="#E1BEE7" stroke="#9C27B0" strokeWidth="0.2"/>
      </g>
    ),

    // 3D Heart (Wellness)
    Heart: (
      <g>
        <defs>
          <radialGradient id="heartGrad" cx="30%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#ff8a80" />
            <stop offset="100%" stopColor="#d32f2f" />
          </radialGradient>
        </defs>
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="url(#heartGrad)" stroke="#b71c1c" strokeWidth="0.5" filter="drop-shadow(0 2px 4px rgba(211,47,47,0.4))"/>
        <path d="M16 6 C15 5 14 5.5 13.5 6.5" stroke="white" strokeWidth="1" strokeLinecap="round" opacity="0.4"/>
      </g>
    ),

    // 3D Tools (Wrench/Screwdriver)
    WrenchScrewdriver: (
      <g filter="drop-shadow(1px 1px 2px rgba(0,0,0,0.4))">
        <rect x="11" y="2" width="3" height="18" rx="1" fill="#FF7043" transform="rotate(45 12 12)" />
        <rect x="11" y="2" width="3" height="18" rx="1" fill="#78909C" transform="rotate(-45 12 12)" />
        <circle cx="12" cy="12" r="3" fill="#B0BEC5" stroke="#78909C" />
      </g>
    ),
    
    // 3D Platform Settings (Gear/Tooth)
    Cog6Tooth: (
      <g>
        <defs>
          <linearGradient id="gearSilver" x1="0%" y1="0%" x2="100%" y2="100%">
             <stop offset="0%" stopColor="#ECEFF1" />
             <stop offset="100%" stopColor="#90A4AE" />
          </linearGradient>
        </defs>
        <path d="M12 2 L14 5 L17.5 5.5 L19 8.5 L16.5 11 L17 14 L20 16 L18 19 L15 18 L13 20 L11 20 L9 18 L6 19 L4 16 L7 14 L7.5 11 L5 8.5 L6.5 5.5 L10 5 L12 2Z" fill="url(#gearSilver)" stroke="#546E7A" strokeWidth="0.5" filter="drop-shadow(1px 1px 2px rgba(0,0,0,0.3))"/>
        <circle cx="12" cy="12" r="4" fill="#37474F" />
        <circle cx="12" cy="12" r="2" fill="#78909C" />
      </g>
    ),

    // 3D Overlay Settings (SquaresPlus)
    SquaresPlus: (
      <g filter="drop-shadow(1px 2px 3px rgba(0,0,0,0.3))">
        <rect x="4" y="4" width="8" height="8" rx="2" fill="#7E57C2" stroke="#512DA8" strokeWidth="0.5" />
        <rect x="12" y="12" width="8" height="8" rx="2" fill="#26A69A" stroke="#00796B" strokeWidth="0.5" />
        <path d="M16 4 V8 M14 6 H18" stroke="#FFB74D" strokeWidth="2" strokeLinecap="round" />
      </g>
    ),
    
    // 3D Hobbies (Palette)
    Hobbies: (
        <g filter="drop-shadow(1px 2px 3px rgba(0,0,0,0.3))">
            <path d="M12 2 C6.48 2 2 6.48 2 12 C2 17.52 6.48 22 12 22 C17.52 22 22 17.52 22 12 C22 6.48 17.52 2 12 2 Z M12 20 C11.45 20 11 19.55 11 19 C11 18.45 11.45 18 12 18 C12.55 18 13 18.45 13 19 C13 19.55 12.55 20 12 20 Z M7.5 15 C6.67 15 6 14.33 6 13.5 C6 12.67 6.67 12 7.5 12 C8.33 12 9 12.67 9 13.5 C9 14.33 8.33 15 7.5 15 Z M9.5 9 C8.67 9 8 8.33 8 7.5 C8 6.67 8.67 6 9.5 6 C10.33 6 11 6.67 11 7.5 C11 8.33 10.33 9 9.5 9 Z M14.5 9 C13.67 9 13 8.33 13 7.5 C13 6.67 13.67 6 14.5 6 C15.33 6 16 6.67 16 7.5 C16 8.33 15.33 9 14.5 9 Z M17.5 14 C16.67 14 16 13.33 16 12.5 C16 11.67 16.67 11 17.5 11 C18.33 11 19 11.67 19 12.5 C19 13.33 18.33 14 17.5 14 Z" fill="#8D6E63" stroke="#5D4037" strokeWidth="0.5"/>
            <circle cx="7.5" cy="13.5" r="1.5" fill="#EF5350" />
            <circle cx="9.5" cy="7.5" r="1.5" fill="#42A5F5" />
            <circle cx="14.5" cy="7.5" r="1.5" fill="#66BB6A" />
        </g>
    ),

    // ==========================================
    // UI ELEMENTS
    // ==========================================

    Search: (
      <g>
        <circle cx="10" cy="10" r="7" stroke="#607D8B" strokeWidth="2" fill="#E0F7FA" opacity="0.6" />
        <rect x="15" y="15" width="8" height="3" rx="1.5" transform="rotate(45 19 16.5)" fill="#F57C00" />
      </g>
    ),
    Bell: (
      <g>
        <path d="M12 3 C8 3 5 6 5 12 L4 16 H20 L19 12 C19 6 16 3 12 3Z" fill="#FBC02D" stroke="#F9A825" strokeWidth="0.5"/>
        <circle cx="12" cy="18" r="2" fill="#F57F17" />
      </g>
    ),
    Envelope: (
      <g>
        <rect x="2" y="4" width="20" height="14" rx="1" fill="#E3F2FD" stroke="#90CAF9" />
        <path d="M2 4 L12 12 L22 4" stroke="#90CAF9" />
      </g>
    ),
    Grid: (
      <g>
        <circle cx="5" cy="5" r="2.5" fill="#3041c7" /> <circle cx="12" cy="5" r="2.5" fill="#3041c7" /> <circle cx="19" cy="5" r="2.5" fill="#3041c7" />
        <circle cx="5" cy="12" r="2.5" fill="#3041c7" /> <circle cx="12" cy="12" r="2.5" fill="#3041c7" /> <circle cx="19" cy="12" r="2.5" fill="#3041c7" />
        <circle cx="5" cy="19" r="2.5" fill="#3041c7" /> <circle cx="12" cy="19" r="2.5" fill="#3041c7" /> <circle cx="19" cy="19" r="2.5" fill="#3041c7" />
      </g>
    ),
    Toggle: (
      <g>
        <rect x="2" y="6" width="20" height="12" rx="6" fill="#e0e0e0" stroke="#bdbdbd" />
        <circle cx="16" cy="12" r="5" fill="#1d2a78" />
      </g>
    ),
    Book: (
      <g>
        <rect x="4" y="2" width="16" height="20" rx="1" fill="#1565C0" />
        <path d="M6 2 V22" stroke="white" opacity="0.3"/>
        <rect x="8" y="6" width="8" height="2" fill="white" opacity="0.8"/>
      </g>
    ),
    X: <path d="M6 6 L18 18 M18 6 L6 18" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />,
    Minimize: <path d="M5 12 H19" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />,
    ChevronRight: <path d="M9 18 L15 12 L9 6" stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none" />,
    ChevronLeft: <path d="M15 18 L9 12 L15 6" stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none" />,
    UserIcon: (
        <g>
            <circle cx="12" cy="8" r="4" fill="#90A4AE" />
            <path d="M4 20 C4 16 7 14 12 14 C17 14 20 16 20 20" fill="#90A4AE" />
        </g>
    ),
    PlusCircle: (
      <g>
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
        <path d="M12 7 V17 M7 12 H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </g>
    ),
    List: (
      <g>
        <path d="M4 6 H20 M4 12 H20 M4 18 H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </g>
    ),
    EllipsisHorizontal: (
      <g>
        <circle cx="5" cy="12" r="1.5" fill="currentColor" />
        <circle cx="12" cy="12" r="1.5" fill="currentColor" />
        <circle cx="19" cy="12" r="1.5" fill="currentColor" />
      </g>
    ),
    BoltIcon: (
      <path d="M13 2 L3 14 H12 L11 22 L21 10 H12 L13 2 Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    ),
    DocumentTextIcon: (
      <g>
         <path d="M6 2 H14 L18 6 V22 H6 Z" stroke="currentColor" strokeWidth="2" />
         <path d="M14 2 V6 H18" stroke="currentColor" strokeWidth="2" />
      </g>
    ),
    PencilIcon: (
        <path d="M14 3 L21 10 L10 21 L3 21 L3 14 L14 3 Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    ),
    ArrowRightIcon: <path d="M4 12 H20 M14 6 L20 12 L14 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    CommandLineIcon: (
        <g>
            <rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="2" />
            <path d="M6 8 L10 12 L6 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M12 16 H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </g>
    ),
    RunningIcon: <path d="M5 20 L9 16 L7 12 L11 10 L14 13 L19 12 M13 6 C13 7 12 8 11 8 C10 8 9 7 9 6 C9 5 10 4 11 4 C12 4 13 5 13 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />,
    MoonIcon: <path d="M20 12 A8 8 0 1 1 12 4 A6 6 0 0 0 20 12 Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" fill="none" />,
    FireIcon: <path d="M12 2C12 2 5 8 5 13C5 17 8 20 12 20C16 20 19 17 19 13C19 8 12 2 12 2ZM12 18C10 18 8 16 8 13C8 11 10 8 12 6C14 8 16 11 16 13C16 16 14 18 12 18Z" fill="currentColor" />,
    AppleIcon: (
      <g>
        <circle cx="12" cy="13" r="7" stroke="currentColor" strokeWidth="2" />
        <path d="M12 6 V3 M12 6 L14 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </g>
    ),
    ArrowPathIcon: <path d="M4 12 A8 8 0 1 1 12 20 A8 8 0 0 1 12 4 M12 8 V12 L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />,
    TrashIcon: <path d="M3 6 H21 M8 6 V4 H16 V6 M10 11 V17 M14 11 V17 M5 6 L6 20 H18 L19 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />,
    
    // ==========================================
    // DOCK APPS (3D)
    // ==========================================
    StudioIcon3D: (
      <g>
        <rect x="2" y="2" width="20" height="20" rx="5" fill="#212121" />
        <path d="M7 6 L17 12 L7 18 Z" fill="#ff9100" />
      </g>
    ),
    SettingsIcon3D: (
      <g>
        <rect x="2" y="2" width="20" height="20" rx="5" fill="#607D8B" />
        <circle cx="12" cy="12" r="5" stroke="#CFD8DC" strokeWidth="3" fill="none" />
      </g>
    ),
    MessagingIcon3D: (
      <g>
        <rect x="2" y="2" width="20" height="20" rx="5" fill="#4CAF50" />
        <path d="M12 7 C8 7 5 9 5 12 C5 14 7 16 9 16 V19 L12 16 H13 C17 16 20 14 20 12" fill="white" />
      </g>
    ),
    MediaIcon3D: (
      <g>
        <rect x="2" y="2" width="20" height="20" rx="5" fill="#E91E63" />
        <path d="M9 8 L16 12 L9 16 V8" fill="white" />
      </g>
    ),
    ActivitiesIcon3D: (
      <g>
        <rect x="2" y="2" width="20" height="20" rx="5" fill="#FF9800" />
        <path d="M6 14 L10 8 L14 12 L18 6" stroke="white" strokeWidth="2" fill="none"/>
      </g>
    ),
    ReligionIcon3D: (
      <g>
        <rect x="2" y="2" width="20" height="20" rx="5" fill="#795548" />
        <path d="M12 5 V19 M7 10 H17" stroke="#D7CCC8" strokeWidth="2" />
      </g>
    ),
    IslamIcon3D: (
      <g>
        <rect x="2" y="2" width="20" height="20" rx="5" fill="#00695C" />
        {/* Crescent Moon */}
        <path d="M15 12 A 5 5 0 1 1 10 7 A 4 4 0 1 0 15 12 Z" fill="white" />
        {/* Star */}
        <polygon points="16.5,6 17,7.5 18.5,7.5 17.25,8.5 17.75,10 16.5,9 15.25,10 15.75,8.5 14.5,7.5 16,7.5" fill="white" />
      </g>
    ),
    SportIcon3D: (
      <g>
        <rect x="2" y="2" width="20" height="20" rx="5" fill="#2E7D32" />
        <circle cx="12" cy="12" r="6" fill="white" opacity="0.2"/>
        <path d="M12 6 A6 6 0 0 1 12 18" stroke="white" fill="none"/>
      </g>
    ),
    HelpIcon3D: (
      <g>
        <rect x="2" y="2" width="20" height="20" rx="5" fill="#3F51B5" />
        <text x="12" y="17" fontSize="14" fontWeight="bold" fill="white" textAnchor="middle">?</text>
      </g>
    ),
    EventsIcon3D: (
      <g>
        <rect x="2" y="2" width="20" height="20" rx="5" fill="#9C27B0" />
        <rect x="6" y="7" width="12" height="11" fill="white" rx="1"/>
      </g>
    ),
    MarketIcon3D: (
      <g>
        <rect x="2" y="2" width="20" height="20" rx="5" fill="#009688" />
        <path d="M7 10 L12 18 L17 10 H7 Z" fill="white" />
      </g>
    ),
    ServicesIcon3D: (
      <g>
        <rect x="2" y="2" width="20" height="20" rx="5" fill="#673AB7" />
        <circle cx="12" cy="12" r="4" stroke="white" strokeWidth="2" fill="none"/>
      </g>
    ),
    GamificationIcon3D: (
      <g>
        <rect x="2" y="2" width="20" height="20" rx="5" fill="#2196F3" />
        <path d="M12 5 L14 9 H18 L15 12 L16 16 L12 14 L8 16 L9 12 L6 9 H10 Z" fill="#FFEB3B" />
      </g>
    ),
    TransportIcon3D: (
      <g>
        <rect x="2" y="2" width="20" height="20" rx="5" fill="#03A9F4" />
        <path d="M5 14 L19 14 L17 8 H7 L5 14" fill="white" />
      </g>
    ),
    WellnessIcon3D: (
      <g>
        <rect x="2" y="2" width="20" height="20" rx="5" fill="#F44336" />
        <path d="M12 18 L10.5 16.5 C5 11.5 4 10 4 7.5 C4 5.5 5.5 4 7.5 4 C9 4 10.5 5 12 6.5 C13.5 5 15 4 16.5 4 C18.5 4 20 5.5 20 7.5 C20 10 16 11.5 13.5 16.5 L12 18 Z" fill="white" />
      </g>
    ),

    CurrencyDollarIcon: <path d="M12 2 V22 M17 5 H9.5 C8.5 5 7.5 5.5 7.5 7 C7.5 9 9 10 10.5 10.5 L13.5 11.5 C15 12 16.5 13 16.5 15 C16.5 16.5 15.5 17 14.5 17 H7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />,
    
    // Missing Icons & Aliases
    Money: <path d="M12 2 V22 M17 5 H9.5 C8.5 5 7.5 5.5 7.5 7 C7.5 9 9 10 10.5 10.5 L13.5 11.5 C15 12 16.5 13 16.5 15 C16.5 16.5 15.5 17 14.5 17 H7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />,
    TrendingDown: <path d="M2.25 6L9 12.75l4.286-4.286a11.948 11.948 0 014.306 6.43l.776 2.898m0 0l3.182-5.511m-3.182 5.51l-5.511-3.181" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    ExclamationTriangle: <path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    ExclamationCircle: <path d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    CheckCircle: <path d="M9 12 L11 14 L15 10 M21 12 A9 9 0 1 1 12 3 A9 9 0 0 1 21 12 Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />,

    UserGroup: (
      <g>
        <path d="M17 21 V19 C17 16.79 15.21 15 13 15 H5 C2.79 15 1 16.79 1 19 V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M23 21 V19 C22.99 17.52 22.22 16.18 21 15.36" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M16 3.13 C17.22 3.95 18 5.38 18 7 C18 8.62 17.22 10.05 16 10.87" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    ),
    
    // Generic Fallbacks for App Subnav
    PaperAirplane: <path d="M3 21 L21 12 L3 3 V10 L14 12 L3 14 V21 Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />,
    PlayIcon: <path d="M8 5 V19 L19 12 L8 5 Z" fill="currentColor" />,
    TvIcon: <path d="M21 6H3C1.9 6 1 6.9 1 8V16C1 17.1 1.9 18 3 18H8L6 22H18L16 18H21C22.1 18 23 17.1 23 16V8C23 6.9 22.1 6 21 6ZM21 16H3V8H21V16Z" fill="currentColor" />,
    PauseIcon: <path d="M8 5 H10 V19 H8 Z M14 5 H16 V19 H14 Z" fill="currentColor" />,
    HandThumbUpIcon: <path d="M7 11 V19 M7 13 H3 L5 5 H13 L11 9 H18 L16 19 H7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />,
    CalendarIcon: <path d="M4 6 H20 M4 10 H20 M4 6 V20 H20 V6 M8 4 V8 M16 4 V8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />,
    MapPinIcon: <path d="M12 2 C8 2 5 5 5 9 C5 15 12 22 12 22 C12 22 19 15 19 9 C19 5 16 2 12 2 Z M12 10 A3 3 0 1 1 12 4 A3 3 0 0 1 12 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />,
    TruckIcon: <path d="M3 10 H15 L18 14 H21 V18 H3 V10 M15 18 A2 2 0 1 1 15 14 A2 2 0 0 1 15 18 M7 18 A2 2 0 1 1 7 14 A2 2 0 0 1 7 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />,
    ShareIcon: <path d="M15 8 L18 5 L21 8 M18 5 V15 M5 12 V19 H19 V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />,
    CheckCircleIcon: <path d="M9 12 L11 14 L15 10 M21 12 A9 9 0 1 1 12 3 A9 9 0 0 1 21 12 Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />,
    TicketIcon: <path d="M4 8 L20 8 M4 16 L20 16 M4 6 H20 V18 H4 Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />,
    TrophyIcon: <path d="M8 4 H16 M8 4 V10 C8 12 10 14 12 14 C14 14 16 12 16 10 V4 M12 14 V18 M8 20 H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />,
    StarIcon: <path d="M12 2 L15 9 H22 L17 13 L19 21 L12 17 L5 21 L7 13 L2 9 H9 L12 2 Z" fill="currentColor" stroke="none" />,
    BookOpenIcon: <path d="M4 6 C4 6 6 4 12 4 C18 4 20 6 20 6 V20 C20 20 18 18 12 18 C6 18 4 20 4 20 V6 Z M12 4 V18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />,
    
    // File Management Icons
    Folder: <path d="M3 7 V19 H21 V9 H13 L11 7 H3 Z" fill="currentColor" />,
    FolderOpen: <path d="M3 7 V19 H21 V9 H13 L11 7 H3 Z M21 11 L19 19 H5 L3 11 H21 Z" fill="currentColor" />,
    ArrowUpTrayIcon: <path d="M12 15 V3 M12 3 L8 7 M12 3 L16 7 M4 17 V19 H20 V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    ArrowDownTrayIcon: <path d="M12 3 V15 M12 15 L8 11 M12 15 L16 11 M4 17 V19 H20 V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    FolderPlusIcon: <path d="M3 7 V19 H21 V9 H13 L11 7 H3 Z M12 11 V17 M9 14 H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />,
    CheckIcon: <path d="M5 13 L9 17 L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    XMarkIcon: <path d="M6 18 L18 6 M6 6 L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    ExclamationCircleIcon: <path d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    
    // Communication Icons
    ArrowLeftIcon: <path d="M10 19 L3 12 L10 5 M3 12 H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    ArchiveBoxIcon: <path d="M20 8 V21 H4 V8 M2 3 H22 V8 H2 V3 Z M10 12 H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />,
    ArrowUturnLeftIcon: <path d="M9 15 L3 9 M3 9 L9 3 M3 9 H15 C19 9 22 12 22 16 C22 20 19 23 15 23 H11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />,
    PaperClipIcon: <path d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    PhotoIcon: <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    
    // Theme Icons
    SunIcon: <path d="M12 3V4M12 20V21M4 12H3M21 12H20M5.636 5.636L6.343 6.343M17.657 17.657L18.364 18.364M5.636 18.364L6.343 17.657M17.657 6.343L18.364 5.636M12 8A4 4 0 1012 16A4 4 0 0012 8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    ComputerDesktopIcon: <path d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    
    // Aliases & New Icons for ProjectsApp
    FolderOpenIcon: <path d="M3 7 V19 H21 V9 H13 L11 7 H3 Z M21 11 L19 19 H5 L3 11 H21 Z" fill="currentColor" />,
    FolderIcon: <path d="M3 7 V19 H21 V9 H13 L11 7 H3 Z" fill="currentColor" />,
    Cog6ToothIcon: (
      <g>
        <path d="M12 2 L14 5 L17.5 5.5 L19 8.5 L16.5 11 L17 14 L20 16 L18 19 L15 18 L13 20 L11 20 L9 18 L6 19 L4 16 L7 14 L7.5 11 L5 8.5 L6.5 5.5 L10 5 L12 2Z" fill="currentColor" stroke="currentColor" strokeWidth="0.5" />
        <circle cx="12" cy="12" r="3" fill="white" />
      </g>
    ),
    EllipsisHorizontalIcon: (
      <g>
        <circle cx="5" cy="12" r="1.5" fill="currentColor" />
        <circle cx="12" cy="12" r="1.5" fill="currentColor" />
        <circle cx="19" cy="12" r="1.5" fill="currentColor" />
      </g>
    ),
    CloudArrowUpIcon: <path d="M12 16 V9 M12 9 L9 12 M12 9 L15 12 M5 16 V17 C5 19.2 6.8 21 9 21 H15 C17.2 21 19 19.2 19 17 V16 M16 16 C19 16 21 14 21 11 C21 8 19 6 16 6 C16 3 13 2 10 3 C7 4 6 7 6 7 C3 7 2 9 2 12 C2 14 4 16 6 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />,
    FunnelIcon: <path d="M3 4 H21 L14 12 V18 L10 20 V12 L3 4 Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />,
    VideoCameraIcon: <path d="M15 10 L20 6 V18 L15 14 V10 Z M4 8 H15 V16 H4 V8 Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />,
    SpeakerWaveIcon: <path d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    
    // ==========================================
    // NEW ICONS (Standardized)
    // ==========================================
    GlobeAltIcon: <path d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    CpuChipIcon: <path d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6.75v10.5a2.25 2.25 0 002.25 2.25z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    ShieldCheckIcon: <path d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    AcademicCapIcon: <path d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.499 5.258 50.55 50.55 0 00-2.658.813m-15.482 0A50.923 50.923 0 0112 13.489a50.92 50.92 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    UsersIcon: <path d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    XCircleIcon: <path d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    CogIcon: <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    HomeIcon: <path d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    BellIcon: <path d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    SearchIcon: <path d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    MagnifyingGlassIcon: <path d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    MenuIcon: <path d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    ChevronDownIcon: <path d="M19.5 8.25l-7.5 7.5-7.5-7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    ChevronUpIcon: <path d="M4.5 15.75l7.5-7.5 7.5 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    PlusIcon: <path d="M12 4.5v15m7.5-7.5h-15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    MinusIcon: <path d="M19.5 12h-15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    InformationCircleIcon: <path d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    QuestionMarkCircleIcon: <path d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    ArrowRightOnRectangleIcon: <path d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    ArrowLeftOnRectangleIcon: <path d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    EyeIcon: <path d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    EyeSlashIcon: <path d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    LockClosedIcon: <path d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    LockOpenIcon: <path d="M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75M3.75 21.75h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    UserPlusIcon: <path d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    UserMinusIcon: <path d="M22 10.5h-6m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    GiftIcon: <path d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H4.5a1.5 1.5 0 01-1.5-1.5v-8.25M3 11.25h18M3 11.25c0-1.656 1.344-3 3-3h1.5m13.5 3c0-1.656-1.344-3-3-3h-1.5m-1.5 0l-3-3m0 0l-3 3m3-3v11.25" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    ChartBarIcon: <path d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    ChartPieIcon: <path d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    ChartPieIconFilled: <path d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" fill="currentColor" stroke="none" />,
    ShieldExclamationIcon: <path d="M12 9v3.75m0-10.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.002A11.959 11.959 0 0112 2.714zM12 15.75h.007v.008H12v-.008z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    StopIcon: <path d="M5.25 7.5A2.25 2.25 0 017.5 5.25h9a2.25 2.25 0 012.25 2.25v9a2.25 2.25 0 01-2.25 2.25h-9a2.25 2.25 0 01-2.25-2.25v-9z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    StopCircleIcon: <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    
    // Additional Standard Icons
    BriefcaseIcon: <path d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    PresentationChartLineIcon: <path d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    PlusCircleIcon: (
      <g>
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
        <path d="M12 7 V17 M7 12 H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </g>
    ),
    UserGroupIcon: (
      <g>
        <path d="M17 21 V19 C17 16.79 15.21 15 13 15 H5 C2.79 15 1 16.79 1 19 V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M23 21 V19 C22.99 17.52 22.22 16.18 21 15.36" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M16 3.13 C17.22 3.95 18 5.38 18 7 C18 8.62 17.22 10.05 16 10.87" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    ),
    WrenchScrewdriverIcon: <path d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    GraduationCapIcon: <path d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.499 5.258 50.55 50.55 0 00-2.658.813m-15.482 0A50.923 50.923 0 0112 13.489a50.92 50.92 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    
    // Quantum Quiz Icons
    Brain: <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3M3.343 15.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    "help-circle": <path d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    check: <path d="M4.5 12.75l6 6 9-13.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    "arrow-right": <path d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    info: <path d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    award: <path d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.504-1.125-1.125-1.125h-6.75a1.125 1.125 0 01-1.125-1.125v-3.375m9-6.75h.75c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125h-.75m-9-3.75h-.75a1.125 1.125 0 00-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125h.75m-.75-3.75h.008v.008h-.008v-.008zm6.75 0h.008v.008h-.008v-.008z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    ClockIcon: <path d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    SparklesIcon: <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    ChatBubbleBottomCenterTextIcon: <path d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    HandRaisedIcon: <path d="M10.05 4.575a1.575 1.575 0 10-3.15 0v3m3.15-3v-1.5a1.575 1.575 0 013.15 0v1.5m-3.15 0l.075 5.925m3.075.75V4.575m0 0a1.575 1.575 0 013.15 0V15M6.9 7.575a1.575 1.575 0 10-3.15 0v8.175a6.75 6.75 0 006.75 6.75h2.018a5.25 5.25 0 003.712-1.538l1.732-1.732a5.25 5.25 0 001.538-3.712l.003-2.024a.668.668 0 01.198-.471 1.575 1.575 0 10-2.228-2.228 3.818 3.818 0 00-1.12 2.687M6.9 7.575V12m6.27 4.318A4.49 4.49 0 0116.35 15m.002 0h-.002" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    ScaleIcon: <path d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.031.352 5.988 5.988 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 01-2.031.352 5.989 5.989 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    HeartIcon: <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    CalculatorIcon: <path d="M15.75 15.75l-2.489-2.489m0 0a3.375 3.375 0 10-4.773-4.773 3.375 3.375 0 004.774 4.774zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    BookmarkIcon: <path d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    
    // Missing Icons from Audit
    BeakerIcon: <path d="M10.5 1.5H13.5V4.5H10.5V1.5ZM4.5 19.5C4.5 20.3284 5.17157 21 6 21H18C18.8284 21 19.5 20.3284 19.5 19.5V13.5L15 6H9L4.5 13.5V19.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    PhoneIcon: <path d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    CameraIcon: <path d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316zM16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    MapIcon: <path d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.159.69.159 1.006 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    LightBulbIcon: <path d="M12 18v-1.578c0-1.667.928-3.204 2.43-4.022 1.833-.998 2.757-3.052 2.263-5.035a6.002 6.002 0 00-7.386 0c-.494 1.983.43 4.037 2.263 5.035 1.502.818 2.43 2.355 2.43 4.022V18m-2.25 2.25h4.5m-6.75-2.25h9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    LocationMarker: <path d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0zM19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    ExclamationTriangleIcon: <path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    KeyIcon: <path d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    UserCircleIcon: <path d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    CreditCardIcon: <path d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    DotsVertical: (
      <g>
        <circle cx="12" cy="5" r="1.5" fill="currentColor" />
        <circle cx="12" cy="12" r="1.5" fill="currentColor" />
        <circle cx="12" cy="19" r="1.5" fill="currentColor" />
      </g>
    ),
    FaceSmileIcon: <path d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    
    // Additional Missing Icons
    MicrophoneIcon: <path d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    PaperAirplaneIcon: <path d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    PaintBrushIcon: <path d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    ServerIcon: <path d="M21 7.5l-2.25-1.313M21 7.5v2.25m0-2.25l-2.25 1.313M3 7.5l2.25-1.313M3 7.5l2.25 1.313M3 7.5v2.25m9 3l2.25-1.313M12 12.75l-2.25-1.313M12 12.75V15m0 6.75l2.25-1.313M12 21.75V19.5m0 2.25l-2.25-1.313m0-16.875L12 2.25l2.25 1.313M21 14.25v2.25l-2.25 1.313m0 0l-2.25-1.313M21 14.25l-2.25-1.313M3 14.25l2.25-1.313m0 0l2.25 1.313M3 14.25v2.25l2.25 1.313" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    RocketLaunchIcon: <path d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    Footprints: <path d="M19.19 12.79a5.23 5.23 0 00-3.57-1.46 5.23 5.23 0 00-3.57 1.46l-1.41 1.41a5.23 5.23 0 000 7.4 5.23 5.23 0 007.4 0 5.23 5.23 0 000-7.4l-1.41-1.41zM7.07 11.21a5.23 5.23 0 003.57 1.46 5.23 5.23 0 003.57-1.46l1.41-1.41a5.23 5.23 0 000-7.4 5.23 5.23 0 00-7.4 0 5.23 5.23 0 000 7.4l1.41 1.41z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    
    // Aliases
    BookOpen: <path d="M4 6 C4 6 6 4 12 4 C18 4 20 6 20 6 V20 C20 20 18 18 12 18 C6 18 4 20 4 20 V6 Z M12 4 V18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />,
    Users: <path d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    Fire: <path d="M12 2C12 2 5 8 5 13C5 17 8 20 12 20C16 20 19 17 19 13C19 8 12 2 12 2ZM12 18C10 18 8 16 8 13C8 11 10 8 12 6C14 8 16 11 16 13C16 16 14 18 12 18Z" fill="currentColor" />,
    Trophy: <path d="M8 4 H16 M8 4 V10 C8 12 10 14 12 14 C14 14 16 12 16 10 V4 M12 14 V18 M8 20 H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />,
    
    // Dashboard Icons
    MegaphoneIcon: <path d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.996.912 2.168 1.92 3.186a2.25 2.25 0 002.699.563l3.948-2.297c.95-.553 1.06-1.757.47-2.512-.41-.527-.62-1.164-.62-1.81v-1.54c0-.646.21-1.283.62-1.81.59-.755.48-1.959-.47-2.512l-3.948-2.297a2.25 2.25 0 00-2.699.563c-1.008 1.018-1.667 2.19-1.92 3.186m0 9.18l-2.133 2.133a2.25 2.25 0 01-3.182-3.182l2.133-2.133" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    Squares2X2Icon: <path d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25A2.25 2.25 0 0113.5 8.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    
    // ==========================================
    // NEW MISSING ICONS (Added Dec 2024)
    // ==========================================
    
    // Activity visualization - line graph pattern
    Activity: <path d="M22 12h-4l-3 9L9 3l-3 9H2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    
    // ==========================================
    // CREATOR STUDIO ICONS
    // ==========================================
    
    // Text Alignment Icons
    Bars3BottomLeftIcon: <path d="M3.75 5.25h16.5m-16.5 4.5h16.5m-16.5 4.5h10.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    Bars3Icon: <path d="M3.75 9h16.5m-16.5-4.5h16.5M3.75 13.5h16.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    Bars3BottomRightIcon: <path d="M3.75 5.25h16.5m-16.5 4.5h16.5m0 4.5h-10.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    Bars4Icon: <path d="M3.75 5.25h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    
    // Cursor & Selection Tools
    CursorArrowRays: (
      <g>
        <path d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zM12 2.25V4.5m5.834.166l-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.243l-1.59-1.59" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    ),
    
    // Shape Tools
    Type: (
      <g>
        <path d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M8 5 V19 M16 5 V19 M5 12 H19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </g>
    ),
    Square2Stack: (
      <g>
        <path d="M16.5 8.25V6a2.25 2.25 0 00-2.25-2.25H6A2.25 2.25 0 003.75 6v8.25A2.25 2.25 0 006 16.5h2.25m8.25-8.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-7.5A2.25 2.25 0 018.25 18v-1.5m8.25-8.25h-6a2.25 2.25 0 00-2.25 2.25v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    ),
    Pencil: <path d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    EyeDropperIcon: (
      <g>
        <path d="M15 11.25l1.5 1.5.75-.75V8.758l2.276-.61a3 3 0 10-3.675-3.675l-.61 2.277H12l-.75.75 1.5 1.5M15 11.25l-8.47 8.47c-.34.34-.8.53-1.28.53s-.94.19-1.28.53l-.97.97-.75-.75.97-.97c.34-.34.53-.8.53-1.28s.19-.94.53-1.28L12.75 9m2.25 2.25L12.75 9m0 0L10.5 6.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    ),
    SwatchIcon: (
      <g>
        <path d="M4.098 19.902a3.75 3.75 0 005.304 0l6.401-6.402M6.75 21A3.75 3.75 0 013 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 003.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072M10.5 8.197l2.88-2.88c.438-.439 1.15-.439 1.59 0l3.712 3.713c.44.44.44 1.152 0 1.59l-2.879 2.88M6.75 17.25h.008v.008H6.75v-.008z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    ),
    Photo: <path d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    Plus: <path d="M12 4.5v15m7.5-7.5h-15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    Lightning: (
      <g>
        <path d="M13 3L4 14h7l-1 7 9-11h-7l1-7z" fill="currentColor" />
      </g>
    ),
    CloudIcon: <path d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z" fill="currentColor" />,
    
    // Drag handle - vertical grip dots
    GripVertical: (
      <g>
        <circle cx="9" cy="5" r="1" fill="currentColor" />
        <circle cx="9" cy="12" r="1" fill="currentColor" />
        <circle cx="9" cy="19" r="1" fill="currentColor" />
        <circle cx="15" cy="5" r="1" fill="currentColor" />
        <circle cx="15" cy="12" r="1" fill="currentColor" />
        <circle cx="15" cy="19" r="1" fill="currentColor" />
      </g>
    ),
    
    // Tag/Label icon
    TagIcon: <path d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    
    // Inbox/Empty state icon
    InboxIcon: <path d="M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859m-19.5 0c0-3.866 3.582-7 8-7s8 3.134 8 7m-16 0v5.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V13.5m-16 0h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    
    // Document with checkmark
    DocumentCheckIcon: (
      <g>
        <path d="M6 2 H14 L18 6 V22 H6 Z M14 2 V6 H18" stroke="currentColor" strokeWidth="2" fill="none" />
        <path d="M9 12 L11 14 L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    ),
    
    // Trending up arrow
    TrendingUpIcon: <path d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    
    // Expand arrows (fullscreen)
    ArrowsExpandIcon: <path d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    
    // Aliases for naming consistency
    DownloadIcon: <path d="M12 3 V15 M12 15 L8 11 M12 15 L16 11 M4 17 V19 H20 V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />, // Same as ArrowDownTrayIcon
    CheckBadgeIcon: <path d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />, // Same as ShieldCheckIcon
    ArrowTrendingUpIcon: <path d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />, // Same as TrendingUpIcon
    RefreshCw: <path d="M4 12 A8 8 0 1 1 12 20 A8 8 0 0 1 12 4 M12 8 V12 L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />, // Same as ArrowPathIcon
    Eye: <path d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />, // Same as EyeIcon
    QuestionMarkCircle: <path d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />, // Same as QuestionMarkCircleIcon
    
    // Trending down (ensure consistency)
    "trending-down": <path d="M2.25 6L9 12.75l4.286-4.286a11.948 11.948 0 014.306 6.43l.776 2.898m0 0l3.182-5.511m-3.182 5.51l-5.511-3.181" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    "trending-up": <path d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    
    // ==========================================
    // COMPLETE LUCIDE ICON SET (Additional)
    // ==========================================
    
    
    // ==========================================
    // ADDITIONAL PROJECT-WIDE LUCIDE ICONS
    // ==========================================

    
    // System & Infrastructure
    Server: <rect x="2" y="2" width="20" height="8" rx="2" ry="2" stroke="currentColor" strokeWidth="2" fill="none" />,
    Database: <ellipse cx="12" cy="5" rx="9" ry="3" stroke="currentColor" strokeWidth="2" fill="none" />,
    Shield: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    Globe: <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />,
    Cpu: <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="2" fill="none" />,
    HardDrive: <line x1="22" y1="12" x2="2" y2="12" stroke="currentColor" strokeWidth="2" />,
    MemoryStick: <rect x="6" y="2" width="12" height="20" rx="2" stroke="currentColor" strokeWidth="2" fill="none" />,
    Wifi: <path d="M5 12.55a11 11 0 0114.08 0M1.42 9a16 16 0 0121.16 0M8.53 16.11a6 6 0 016.95 0M12 20h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    
    // Arrows & Direction
    ArrowUp: <line x1="12" y1="19" x2="12" y2="5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />,
    ArrowDown: <line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />,
    ArrowUpCircle: <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />,
    ArrowDownCircle: <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />,
    ChevronUp: <polyline points="18 15 12 9 6 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    Minus: <line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    
    // Communication & Social
    MessageSquare: <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    Mail: <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    Send: <line x1="22" y1="2" x2="11" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    ThumbsUp: <path d="M7 22V11M2 13v6a2 2 0 002 2h2.5M14 2v7a2 2 0 002 2h2m0 0l3-3m-3 3l3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    ThumbsDown: <path d="M17 2v11M22 11V5a2 2 0 00-2-2h-2.5M10 22v-7a2 2 0 00-2-2H6m0 0l-3 3m3-3l-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    
    // Content & Media
    Image: <rect x="3" y="3" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2" fill="none" />,
    Video: <polygon points="23 7 16 12 23 17 23 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    Wand2: <path d="M15 4V2M15 16v-2M8 9h2M20 9h2M17.8 11.8L19 13M17.8 6.2L19 5M3 21l9-9M12.2 6.2L11 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    Hash: <line x1="4" y1="9" x2="20" y2="9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    
    // Document & Organization
    Tag: <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    Save: <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    Table: <path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    
    // Actions & Editing
    Edit3: <path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    Pin: <path d="M12 17v5M9 10.76a2 2 0 01-1.11 1.79l-1.78.9A2 2 0 015 15.24V16a1 1 0 001 1h12a1 1 0 001-1v-.76a2 2 0 01-1.11-1.79l-1.78-.9A2 2 0 0115 10.76V7a1 1 0 011-1 2 2 0 000-4H8a2 2 0 000 4 1 1 0 011 1z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    MoreHorizontal: <circle cx="12" cy="12" r="1" fill="currentColor" />,
    
    // Learning & Education
    Star: <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />,
    ClipboardCheck: <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2M9 2h6v4H9z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    Lightbulb: <path d="M9 18h6M10 22h4M15 8a3 3 0 11-6 0 3 3 0 016 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    
    // Settings & Controls
    Sliders: <line x1="4" y1="21" x2="4" y2="14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
  };

  
  // Smart mapping for generic icons requested in config
  const smartIconName = icons[name] ? name : 'Grid'; // Default to Grid if not found

  return (
    <svg 
      className={sizeClass} 
      viewBox="0 0 24 24" 
      xmlns="http://www.w3.org/2000/svg"
      fill="none" 
    >
      {icons[smartIconName]}
    </svg>
  );
};
