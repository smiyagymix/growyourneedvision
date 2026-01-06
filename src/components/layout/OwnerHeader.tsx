import React, { useState, useRef, useEffect } from 'react';
import { OwnerIcon } from '../shared/OwnerIcons';
import OwnerTabs from './OwnerTabs';
import { EmptyState } from '../shared/ui/CommonUI';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useOS } from '../../context/OSContext';
import { useNotifications } from '../../hooks/useNotifications';
import { useMessages } from '../../hooks/useMessages';
import { isMockEnv } from '../../utils/mockData';

interface HeaderProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
    tabs: string[];
    role?: string;
}

const OwnerHeader: React.FC<HeaderProps> = ({ activeTab, onTabChange, tabs, role = 'Admin' }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { launchApp } = useOS();
  
  const { notifications, dismissNotification, clearAll } = useNotifications(role);
  const { messages } = useMessages(role);
    const disableSearchInteractions = isMockEnv();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isMessagesOpen, setIsMessagesOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const notifRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Handle click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
        if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
            setIsNotifOpen(false);
        }
        if (messagesRef.current && !messagesRef.current.contains(event.target as Node)) {
            setIsMessagesOpen(false);
        }
        if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
            setIsProfileOpen(false);
        }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
        document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [notifRef, messagesRef, profileRef]);

  const handleLogout = () => {
      logout();
      navigate('/login');
  };

  const openProfile = () => {
      launchApp('User Profile');
  }

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && searchQuery.trim()) {
          console.log('Searching for:', searchQuery);
          // In a real app, navigate to search results
          // navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
          launchApp('Search'); // Fixed: launchApp only takes 1 argument in current definition
      }
  };

  // Role-Specific Menu Items
  const getRoleMenuItems = (role: string) => {
      const baseItems = [
          { label: 'My Profile', icon: 'UserIcon', action: openProfile },
      ];

      switch (role) {
          case 'Owner':
              return [
                  ...baseItems,
                  { label: 'Platform Settings', icon: 'Cog6Tooth', action: () => navigate('/admin/settings') },
                  { label: 'Platform Billing', icon: 'CurrencyDollarIcon', action: () => navigate('/admin/school/platform-billing') },
                  { label: 'Help Center', icon: 'QuestionMarkCircleIcon', action: () => launchApp('Help Center') },
              ];
          case 'Admin': // School Admin
          case 'School Admin':
              return [
                  ...baseItems,
                  { label: 'School Settings', icon: 'BuildingOffice2Icon', action: () => navigate('/school-admin/settings') },
                  { label: 'Billing', icon: 'CurrencyDollarIcon', action: () => navigate('/school-admin/finance') },
                  { label: 'Support', icon: 'LifebuoyIcon', action: () => launchApp('Help Center') },
              ];
          case 'Teacher':
              return [
                  ...baseItems,
                  { label: 'My Schedule', icon: 'CalendarIcon', action: () => navigate('/teacher/dashboard/schedule') },
                  { label: 'Gradebook', icon: 'Book', action: () => navigate('/teacher/classes/grading') },
              ];
          case 'Student':
              return [
                  ...baseItems,
                  { label: 'My Grades', icon: 'AcademicCapIcon', action: () => navigate('/student/courses/grades') },
                  { label: 'Assignments', icon: 'DocumentTextIcon', action: () => navigate('/student/assignments') },
              ];
          case 'Parent':
              return [
                  ...baseItems,
                  { label: 'Children Profile', icon: 'UserGroup', action: () => navigate('/parent/dashboard/children') },
                  { label: 'Fee Payments', icon: 'CurrencyDollarIcon', action: () => navigate('/parent/finance') },
              ];
          case 'Individual':
              return [
                  ...baseItems,
                  { label: 'Subscriptions', icon: 'CreditCardIcon', action: () => navigate('/individual/settings/account') },
                  { label: 'My Downloads', icon: 'ArrowDownTrayIcon', action: () => navigate('/individual/projects/asset-library') },
              ];
          default:
              return baseItems;
      }
  };

  const menuItems = getRoleMenuItems(role);

  return (
    <header className="h-12 md:h-16 shrink-0 z-30 flex items-center justify-between px-1 md:px-4 select-none relative border-b md:border border-gray-200 shadow-sm transition-all duration-500 group md:mx-2 md:mt-2 md:mb-2 md:rounded-2xl overflow-visible">
      {/* Background and content */}
      <div className="absolute inset-0 bg-white/90 backdrop-blur-xl z-0 md:rounded-2xl border border-white/20 shadow-sm"></div>
      <div 
        className="absolute inset-0 z-0 opacity-20 mix-blend-overlay md:rounded-2xl pointer-events-none bg-cyber-grid"
      ></div>
      
      {/* ... Visual Elements (Logo, Tabs, etc.) ... */}
      <div className="relative z-10 flex items-center space-x-1 md:space-x-3 shrink-0">
        <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-gyn-blue-dark to-black shadow-lg flex items-center justify-center border border-white/10 group-hover:scale-105 transition-transform duration-300 ring-2 ring-white/10 relative overflow-hidden">
             <div className="absolute inset-0 bg-cyber-grid opacity-30"></div>
             <OwnerIcon name="StudioIcon3D" className="w-5 h-5 md:w-6 md:h-6 text-white drop-shadow-md relative z-10" />
        </div>
                <div className="hidden md:flex flex-col justify-center">
                    <span className="text-[9px] font-extrabold text-blue-600 tracking-widest uppercase opacity-80">Grow Your</span>
                    <span className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-900 to-blue-600 filter drop-shadow-sm">NEED</span>
                </div>
      </div>

            <div className="relative z-10 flex-1 flex justify-center px-1 md:px-8 min-w-0">
         <OwnerTabs activeTab={activeTab} onTabChange={onTabChange} tabs={tabs} />
      </div>

            <div 
                className={`relative z-10 flex items-center gap-2 md:gap-6 shrink-0 ${disableSearchInteractions ? 'pointer-events-none' : ''}`}
            >
             <div className={`hidden md:flex items-center group/search relative w-64 transition-all duration-300 focus-within:w-72 ${disableSearchInteractions ? 'pointer-events-none opacity-70' : ''}`}>
             <div className="absolute inset-0 bg-gray-100 rounded-full shadow-inner border border-gray-200 backdrop-blur-sm transition-all group-focus-within/search:border-blue-400 group-focus-within/search:shadow-md"></div>
             <input 
                type="text" 
                placeholder="Search ecosystem..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearch}
                     className={`w-full h-10 pl-10 pr-4 rounded-full bg-transparent border-none focus:ring-0 text-sm text-gray-800 placeholder-gray-400 relative z-10 font-medium ${disableSearchInteractions ? 'pointer-events-none' : ''}`}
             />
             <OwnerIcon name="SearchIcon" className="w-4 h-4 text-gray-500 absolute left-3.5 z-10 opacity-70 group-hover/search:opacity-100 transition-opacity" />
          </div>

          <div className="flex items-center gap-1 md:gap-2">
            
            {/* Messages Dropdown */}
            <div className="relative" ref={messagesRef}>
                <button 
                    onClick={() => setIsMessagesOpen(!isMessagesOpen)}
                    className={`w-7 h-7 md:w-11 md:h-11 rounded-xl md:rounded-2xl flex items-center justify-center transition-all duration-300 active:scale-95 border backdrop-blur-md shadow-sm
                        ${isMessagesOpen 
                            ? 'bg-blue-100 border-blue-500 text-blue-600 shadow-md ring-1 ring-blue-200' 
                            : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:shadow-md'}
                    `}
                >
                    <OwnerIcon name="Envelope" className="w-3.5 h-3.5 md:w-5 md:h-5" />
                    {messages.length > 0 && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 md:w-3 md:h-3 bg-hud-secondary rounded-full border-2 border-material-gunmetal animate-pulse shadow-sm"></span>
                    )}
                </button>

                {isMessagesOpen && (
                    <div className="absolute right-0 mt-4 w-80 bg-white/90 dark:bg-material-gunmetal/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/50 dark:border-hud-primary/30 overflow-hidden z-50 animate-fadeIn origin-top-right ring-1 ring-black/5 dark:ring-hud-primary/20">
                        <div className="bg-gradient-to-r from-gyn-blue-dark to-gyn-blue-medium dark:from-material-obsidian dark:to-material-gunmetal p-4 text-white flex justify-between items-center shadow-md border-b border-white/10">
                            <span className="font-bold text-sm tracking-wide text-white dark:text-hud-primary">MESSAGES</span>
                            <span className="bg-white/20 dark:bg-hud-primary/20 text-[10px] px-2 py-0.5 rounded-full backdrop-blur-sm font-mono text-white dark:text-hud-primary">{messages.length}</span>
                        </div>
                        <div className="max-h-[350px] overflow-y-auto bg-white/50 dark:bg-transparent">
                            {messages.length === 0 ? (
                                <EmptyState title="No messages" description="Your inbox is empty." icon="Envelope" className="!p-8 !min-h-[200px] dark:text-gray-400"/>
                            ) : (
                                <div className="divide-y divide-gray-100 dark:divide-white/5">
                                    {messages.map(msg => (
                                        <div key={msg.id} className="p-4 hover:bg-blue-50/50 dark:hover:bg-white/5 transition-colors relative group cursor-pointer">
                                            <div className="flex items-start gap-3">
                                                <img src={msg.avatar} alt={msg.sender} className="w-8 h-8 rounded-full border border-gray-200 dark:border-white/10" />
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-baseline mb-0.5">
                                                        <h4 className="font-bold text-xs text-gyn-blue-dark dark:text-white truncate">{msg.sender}</h4>
                                                        <span className="text-[9px] text-gray-400 whitespace-nowrap ml-2">{msg.time}</span>
                                                    </div>
                                                    <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{msg.content}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <button className="w-full py-3 text-[10px] font-bold text-gyn-blue-medium dark:text-hud-primary border-t border-gray-100 dark:border-white/5 hover:bg-blue-50 dark:hover:bg-white/5">View All Messages</button>
                    </div>
                )}
            </div>

            {/* 3D SVG Realistic Separator */}
            <div className="hidden md:flex items-center justify-center mx-2 h-8 w-2 opacity-50">
                <div className="w-[1px] h-full bg-gradient-to-b from-transparent via-gray-300 to-transparent"></div>
            </div>

            <div className="relative" ref={notifRef}>
                <button 
                    onClick={() => setIsNotifOpen(!isNotifOpen)}
                    className={`w-7 h-7 md:w-11 md:h-11 rounded-xl md:rounded-2xl flex items-center justify-center transition-all duration-300 active:scale-95 border backdrop-blur-md shadow-sm
                        ${isNotifOpen 
                            ? 'bg-blue-100 border-blue-500 text-blue-600 shadow-md ring-1 ring-blue-200' 
                            : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:shadow-md'}
                    `}
                >
                    <OwnerIcon name="BellIcon" className="w-3.5 h-3.5 md:w-5 md:h-5" />
                    {notifications.length > 0 && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 md:w-3 md:h-3 bg-red-500 dark:bg-hud-secondary rounded-full border-2 border-white dark:border-material-gunmetal animate-pulse shadow-sm"></span>
                    )}
                </button>

                {isNotifOpen && (
                    <div className="absolute right-0 mt-4 w-80 bg-white/90 dark:bg-material-gunmetal/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/50 dark:border-hud-primary/30 overflow-hidden z-50 animate-fadeIn origin-top-right ring-1 ring-black/5 dark:ring-hud-primary/20">
                        {/* Notification content... same as before */}
                        <div className="bg-gradient-to-r from-gyn-blue-dark to-gyn-blue-medium dark:from-material-obsidian dark:to-material-gunmetal p-4 text-white flex justify-between items-center shadow-md border-b border-white/10">
                            <span className="font-bold text-sm tracking-wide text-white dark:text-hud-primary">NOTIFICATIONS</span>
                            <span className="bg-white/20 dark:bg-hud-primary/20 text-[10px] px-2 py-0.5 rounded-full backdrop-blur-sm font-mono text-white dark:text-hud-primary">{notifications.length}</span>
                        </div>
                        <div className="max-h-[350px] overflow-y-auto bg-white/50 dark:bg-transparent">
                            {notifications.length === 0 ? (
                                <EmptyState title="All caught up" description="No new notifications." icon="Bell" className="!p-8 !min-h-[200px] dark:text-gray-400"/>
                            ) : (
                                <div className="divide-y divide-gray-100 dark:divide-white/5">
                                    {notifications.map(notif => (
                                        <div key={notif.id} className="p-4 hover:bg-blue-50/50 dark:hover:bg-white/5 transition-colors relative group">
                                            <div className="flex justify-between items-start mb-1 pr-6">
                                                <h4 className="font-bold text-xs text-gyn-blue-dark dark:text-white">{notif.title}</h4>
                                                <span className="text-[9px] text-gray-400 whitespace-nowrap ml-2">{notif.time}</span>
                                            </div>
                                            <p className="text-xs text-gray-600 dark:text-gray-400">{notif.message}</p>
                                            <button onClick={(e) => {e.stopPropagation(); dismissNotification(notif.id)}} className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500"><OwnerIcon name="X" className="w-3 h-3" /></button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        {notifications.length > 0 && (
                             <button onClick={clearAll} className="w-full py-3 text-[10px] font-bold text-gyn-blue-medium dark:text-hud-primary border-t border-gray-100 dark:border-white/5 hover:bg-blue-50 dark:hover:bg-white/5">Clear All</button>
                        )}
                    </div>
                )}
            </div>

            {/* 3D SVG Realistic Separator */}
            <div className="hidden md:flex items-center justify-center mx-2 h-8 w-2 opacity-50">
                <div className="w-[1px] h-full bg-gradient-to-b from-transparent via-gray-300 to-transparent"></div>
            </div>
            
            <div className="relative" ref={profileRef}>
                <div 
                    className="flex items-center space-x-1 md:space-x-3 cursor-pointer group"
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                >
                    <div className="text-right hidden sm:block">
                        <p className="text-xs font-bold text-gray-800">{user?.name || 'Guest User'}</p>
                        <p className="text-[10px] text-blue-600 uppercase tracking-wider">{role}</p>
                    </div>
                    <div className="w-7 h-7 md:w-10 md:h-10 rounded-full border-2 border-hud-primary/50 shadow-md overflow-hidden ring-2 ring-transparent group-hover:ring-hud-primary transition-all relative bg-material-obsidian">
                        <img src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.name || 'Guest'}&background=random`} alt="User" className="w-full h-full object-cover" />
                    </div>
                </div>

                {isProfileOpen && (
                    <div className="absolute right-0 mt-4 w-64 bg-material-gunmetal/95 backdrop-blur-xl rounded-xl shadow-2xl border border-hud-primary/30 z-50 animate-fadeIn origin-top-right overflow-hidden">
                        <div className="p-4 border-b border-white/5 bg-white/5">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 rounded-full bg-material-obsidian shadow-sm flex items-center justify-center text-hud-primary font-bold text-sm border border-white/10">
                                    {user?.name?.charAt(0) || 'G'}
                                </div>
                                <div>
                                    <p className="font-bold text-white text-sm">{user?.name || 'Guest User'}</p>
                                    <p className="text-xs text-gray-400 truncate w-32">{user?.email || 'guest@growyourneed.com'}</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="p-1.5 space-y-0.5">
                            {menuItems.map((item, index) => (
                                <button 
                                    key={index}
                                    onClick={() => { setIsProfileOpen(false); item.action(); }}
                                    className="w-full text-left px-4 py-2.5 text-xs font-bold text-gray-300 hover:bg-white/10 hover:text-hud-primary rounded-lg transition-colors flex items-center gap-3 group"
                                >
                                    <div className="w-6 h-6 rounded-md bg-white/5 group-hover:bg-white/10 flex items-center justify-center transition-colors shadow-sm border border-white/5">
                                        <OwnerIcon name={item.icon} className="w-3.5 h-3.5 text-gray-400 group-hover:text-hud-primary" />
                                    </div>
                                    {item.label}
                                </button>
                            ))}
                            <div className="h-px bg-white/5 my-1.5 mx-2"></div>
                            <button 
                                onClick={handleLogout}
                                className="w-full text-left px-4 py-2.5 text-xs font-bold text-red-400 hover:bg-red-900/20 rounded-lg transition-colors flex items-center gap-3 group"
                            >
                                <div className="w-6 h-6 rounded-md bg-red-900/10 group-hover:bg-red-900/20 flex items-center justify-center transition-colors shadow-sm border border-red-900/30">
                                    <OwnerIcon name="ArrowRightIcon" className="w-3.5 h-3.5 text-red-500 rotate-180" />
                                </div>
                                Logout
                            </button>
                        </div>
                    </div>
                )}
            </div>
          </div>
      </div>
    </header>
  );
};

export default OwnerHeader;