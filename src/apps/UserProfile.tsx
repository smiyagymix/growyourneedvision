
import React, { useState } from 'react';
import { z } from 'zod';
import { Icon, Button, Card, Badge } from '../components/shared/ui/CommonUI';
import { useAuth } from '../context/AuthContext';
import { useUserProfile } from '../hooks/useUserProfile';
import pb from '../lib/pocketbase';
import { sanitizeText } from '../utils/sanitization';
import { useToast } from '../hooks/useToast';

const profileUpdateSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name too long')
});

const passwordChangeSchema = z.object({
    oldPassword: z.string().min(1, 'Current password required'),
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm password')
}).refine(data => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword']
});

interface UserProfileProps {
  activeTab: string;
  activeSubNav: string;
}

const UserProfile: React.FC<UserProfileProps> = ({ activeTab, activeSubNav }) => {
  const { user } = useAuth();
  const { updateProfile, changePassword, loading, error, success } = useUserProfile();
  
  // Form States
  const [firstName, setFirstName] = useState(user?.name?.split(' ')[0] || '');
  const [lastName, setLastName] = useState(user?.name?.split(' ').slice(1).join(' ') || '');
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');

  const handleProfileUpdate = async () => {
      const { showToast } = useToast();
      const sanitizedName = sanitizeText(`${firstName} ${lastName}`.trim());
      
      const validationResult = profileUpdateSchema.safeParse({ name: sanitizedName });
      if (!validationResult.success) {
          showToast(validationResult.error.issues[0].message, 'error');
          return;
      }
      
      await updateProfile({ name: validationResult.data.name });
  };

  const handlePasswordChange = async () => {
      const { showToast } = useToast();
      
      const validationResult = passwordChangeSchema.safeParse({
          oldPassword: oldPass,
          newPassword: newPass,
          confirmPassword: confirmPass
      });
      
      if (!validationResult.success) {
          showToast(validationResult.error.issues[0].message, 'error');
          return;
      }
      
      await changePassword(oldPass, newPass, confirmPass);
      setOldPass(''); setNewPass(''); setConfirmPass('');
  };

  const avatarUrl = user?.avatar 
    ? pb.files.getUrl(user, user.avatar)
    : `https://ui-avatars.com/api/?name=${user?.name || 'User'}&background=random`;

  return (
    <div className="max-w-5xl mx-auto py-8 animate-fadeIn">
        
        {/* Header Card */}
        <div className="bg-gradient-to-r from-gyn-blue-dark to-gyn-blue-medium rounded-3xl p-8 text-white shadow-2xl mb-8 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden group">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
            <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 animate-pulse-slow"></div>
            <div className="absolute left-0 bottom-0 w-40 h-40 bg-blue-400/20 rounded-full blur-3xl -ml-10 -mb-10"></div>
            
            <div className="relative z-10">
                <div className="w-28 h-28 rounded-full border-4 border-white/30 shadow-xl overflow-hidden relative group/avatar cursor-pointer transition-transform hover:scale-105">
                    <img src={avatarUrl} alt="User" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-all duration-300 backdrop-blur-sm">
                        <Icon name="CameraIcon" className="w-8 h-8 text-white mb-1" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Change</span>
                        <input 
                            type="file" 
                            className="absolute inset-0 opacity-0 cursor-pointer" 
                            onChange={(e) => {
                                if (e.target.files?.[0]) updateProfile({ avatar: e.target.files[0] });
                            }}
                        />
                    </div>
                </div>
            </div>
            
            <div className="flex-1 text-center md:text-left relative z-10">
                <h1 className="text-4xl font-black mb-2 tracking-tight drop-shadow-md">{user?.name || 'Guest User'}</h1>
                <p className="text-blue-100 font-medium mb-6 flex items-center justify-center md:justify-start gap-2 opacity-90">
                    <Icon name="Briefcase" className="w-4 h-4" />
                    {user?.role || 'Visitor'} 
                    <span className="w-1 h-1 bg-blue-300 rounded-full"></span>
                    {user?.email}
                </p>
                <div className="flex flex-wrap justify-center md:justify-start gap-3">
                    <Badge variant="success" className="bg-white/10 border-white/20 text-white backdrop-blur-md shadow-sm">
                        <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span> Active Status
                    </Badge>
                    <Badge variant="neutral" className="bg-white/10 border-white/20 text-white backdrop-blur-md shadow-sm">
                        <Icon name="LocationMarker" className="w-3 h-3 mr-1" /> San Francisco, CA
                    </Badge>
                </div>
            </div>

            <div className="relative z-10 flex gap-3">
                <Button variant="ghost" className="bg-white/10 text-white hover:bg-white/20 border border-white/20 backdrop-blur-md">
                    <Icon name="ShareIcon" className="w-5 h-5" />
                </Button>
                <Button variant="ghost" className="bg-white text-gyn-blue-dark hover:bg-gray-100 shadow-lg border-none font-bold px-6">
                    Edit Profile
                </Button>
            </div>
        </div>

        {/* Feedback Messages */}
        {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-xl flex items-center gap-3">
                <Icon name="ExclamationCircle" className="w-5 h-5" />
                {error}
            </div>
        )}
        {success && (
            <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 rounded-xl flex items-center gap-3">
                <Icon name="CheckCircle" className="w-5 h-5" />
                {success}
            </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Sidebar (Quick Stats/Info) */}
            <div className="space-y-6">
                <Card variant="default" className="p-6">
                    <h3 className="font-bold text-gray-800 dark:text-white mb-4 uppercase text-xs tracking-wider">Profile Completion</h3>
                    <div className="flex items-center justify-between mb-2 text-sm font-medium">
                        <span className="text-gray-600 dark:text-gray-400">85% Complete</span>
                        <span className="text-gyn-blue-medium font-bold">Excellent</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                        <div className="bg-gyn-blue-medium h-full w-[85%]"></div>
                    </div>
                </Card>

                <Card variant="default" className="p-6">
                    <h3 className="font-bold text-gray-800 dark:text-white mb-4 uppercase text-xs tracking-wider">Contact Information</h3>
                    <ul className="space-y-4 text-sm">
                        <li className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400"><Icon name="Envelope" className="w-4 h-4" /></div>
                            <span className="truncate">{user?.email}</span>
                        </li>
                        <li className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                            <div className="w-8 h-8 rounded-lg bg-green-50 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400"><Icon name="PhoneIcon" className="w-4 h-4" /></div>
                            <span>+1 (555) 123-4567</span>
                        </li>
                        <li className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                            <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400"><Icon name="Briefcase" className="w-4 h-4" /></div>
                            <span>{user?.role}</span>
                        </li>
                    </ul>
                </Card>
            </div>

            {/* Right Panel (Settings Forms) */}
            <Card variant="default" className="lg:col-span-2 p-8">
                <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-6 mb-6">
                    <h2 className="text-xl font-black text-gyn-blue-dark dark:text-white flex items-center gap-2">
                        <Icon name={activeTab === 'Security' ? 'ShieldCheckIcon' : activeTab === 'Notifications' ? 'Bell' : 'UserIcon'} className="w-6 h-6 text-gyn-orange" />
                        {activeTab} Settings
                    </h2>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{activeSubNav}</span>
                </div>

                {activeTab === 'Personal Info' && (
                    <div className="space-y-6 animate-fadeIn">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="group">
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2 ml-1">First Name</label>
                                <div className="relative">
                                    <Icon name="UserIcon" className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                                    <input 
                                        type="text" 
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-800 dark:text-white focus:outline-none focus:border-gyn-blue-medium focus:ring-4 focus:ring-blue-500/10 focus:bg-white dark:focus:bg-gray-700 transition-all shadow-sm" 
                                    />
                                </div>
                            </div>
                            <div className="group">
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2 ml-1">Last Name</label>
                                <div className="relative">
                                    <Icon name="UserIcon" className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                                    <input 
                                        type="text" 
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-800 dark:text-white focus:outline-none focus:border-gyn-blue-medium focus:ring-4 focus:ring-blue-500/10 focus:bg-white dark:focus:bg-gray-700 transition-all shadow-sm" 
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="group">
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2 ml-1">Bio</label>
                            <div className="relative">
                                <Icon name="DocumentTextIcon" className="absolute left-3 top-4 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                                <textarea rows={4} defaultValue="Platform owner and lead administrator responsible for system uptime and tenant management." className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-800 dark:text-white focus:outline-none focus:border-gyn-blue-medium focus:ring-4 focus:ring-blue-500/10 focus:bg-white dark:focus:bg-gray-700 transition-all resize-none shadow-sm" />
                            </div>
                        </div>
                        
                        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-4">
                            <Button variant="ghost" className="hover:bg-gray-100 dark:hover:bg-gray-800">Cancel</Button>
                            <Button 
                                variant="primary"
                                onClick={handleProfileUpdate}
                                disabled={loading}
                                className="shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-shadow"
                            >
                                {loading ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </div>
                    </div>
                )}

                {activeTab === 'Security' && (
                    <div className="space-y-6 animate-fadeIn">
                        <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800 rounded-xl flex items-start gap-3 mb-6 shadow-sm">
                            <div className="p-2 bg-orange-100 dark:bg-orange-900/40 rounded-lg text-orange-600 dark:text-orange-400">
                                <Icon name="ExclamationTriangleIcon" className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-orange-800 dark:text-orange-300">Password Update Required</h4>
                                <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">You haven't changed your password in 90 days. It's recommended to update it now.</p>
                            </div>
                        </div>
                        <div className="group">
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2 ml-1">Current Password</label>
                            <div className="relative">
                                <Icon name="LockClosedIcon" className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                                <input 
                                    type="password" 
                                    value={oldPass}
                                    onChange={(e) => setOldPass(e.target.value)}
                                    placeholder="••••••••" 
                                    className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-800 dark:text-white focus:outline-none focus:border-gyn-blue-medium focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm" 
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="group">
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2 ml-1">New Password</label>
                                <div className="relative">
                                    <Icon name="KeyIcon" className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                                    <input 
                                        type="password" 
                                        value={newPass}
                                        onChange={(e) => setNewPass(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-800 dark:text-white focus:outline-none focus:border-gyn-blue-medium focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm" 
                                    />
                                </div>
                            </div>
                            <div className="group">
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2 ml-1">Confirm Password</label>
                                <div className="relative">
                                    <Icon name="KeyIcon" className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                                    <input 
                                        type="password" 
                                        value={confirmPass}
                                        onChange={(e) => setConfirmPass(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-800 dark:text-white focus:outline-none focus:border-gyn-blue-medium focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm" 
                                    />
                                </div>
                            </div>
                        </div>
                        
                        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-4">
                            <Button 
                                variant="primary"
                                onClick={handlePasswordChange}
                                disabled={loading}
                                className="shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-shadow"
                            >
                                {loading ? 'Updating...' : 'Update Password'}
                            </Button>
                        </div>

                        <div className="border-t border-gray-100 dark:border-gray-700 pt-6 mt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="font-bold text-gray-800 dark:text-white">Two-Factor Authentication</h4>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Add an extra layer of security to your account.</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" defaultChecked />
                                    <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gyn-blue-medium"></div>
                                </label>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'Notifications' && (
                    <div className="space-y-4">
                        {['Email', 'Push Notifications', 'SMS Messages', 'Weekly Digest'].map((item, i) => (
                            <div key={i} className="flex items-center justify-between p-4 border border-gray-100 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                <span className="font-medium text-gray-700 dark:text-gray-300">{item}</span>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" defaultChecked={i < 2} />
                                    <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                                </label>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'Preferences' && (
                    <div className="space-y-6">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Theme</label>
                            <div className="grid grid-cols-3 gap-4">
                                <button className="p-4 border-2 border-gyn-blue-medium bg-white rounded-xl text-center font-bold text-sm text-gyn-blue-dark shadow-sm">Light</button>
                                <button className="p-4 border border-gray-200 dark:border-gray-700 bg-gray-900 rounded-xl text-center font-bold text-sm text-white hover:border-gray-600">Dark</button>
                                <button className="p-4 border border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-100 to-purple-100 rounded-xl text-center font-bold text-sm text-gray-800 hover:border-blue-300">System</button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Language</label>
                            <select className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-800 dark:text-white focus:outline-none focus:border-gyn-blue-medium">
                                <option>English (United States)</option>
                                <option>French (France)</option>
                                <option>Spanish (Spain)</option>
                                <option>German (Germany)</option>
                            </select>
                        </div>
                    </div>
                )}

                {/* Global Save Actions */}
                <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-4">
                    <Button variant="ghost">Cancel</Button>
                    <Button variant="primary">Save Changes</Button>
                </div>
            </Card>
        </div>
    </div>
  );
};

export default UserProfile;
