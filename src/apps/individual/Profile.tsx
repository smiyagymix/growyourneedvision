import React, { useState, useEffect } from 'react';
import { WidgetErrorBoundary } from '../../components/shared/ui/WidgetErrorBoundary';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Camera, MapPin, Globe, Link2, Save, Edit3, X, 
  Trophy, Star, Zap, Calendar, Mail, Shield, Eye, EyeOff,
  Twitter, Github, Linkedin, Instagram, ExternalLink
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { individualService, UserProfile as IUserProfile } from '../../services/individualService';
import { cn } from '../../lib/utils';
import { z } from 'zod';
import { sanitizeText, sanitizeHtml } from '../../utils/sanitization';
import { useToast } from '../../hooks/useToast';

// Profile validation schema
const profileSchema = z.object({
  display_name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  bio: z.string().max(500, 'Bio must be 500 characters or less').optional(),
  location: z.string().max(100).optional(),
  website: z.string().url('Invalid URL format').optional().or(z.literal('')),
  timezone: z.string().optional(),
  visibility: z.enum(['public', 'private']),
  social_links: z.record(z.string(), z.string()).optional(),
  interests: z.array(z.string()).max(15, 'Maximum 15 interests allowed')
});

interface Props {
  activeTab?: string;
  activeSubNav?: string;
}

const SOCIAL_PLATFORMS = [
  { key: 'twitter', label: 'Twitter', icon: Twitter, placeholder: 'username' },
  { key: 'github', label: 'GitHub', icon: Github, placeholder: 'username' },
  { key: 'linkedin', label: 'LinkedIn', icon: Linkedin, placeholder: 'username' },
  { key: 'instagram', label: 'Instagram', icon: Instagram, placeholder: 'username' },
];

const INTEREST_SUGGESTIONS = [
  'Programming', 'Design', 'Marketing', 'Business', 'Finance', 'Data Science',
  'Machine Learning', 'Writing', 'Photography', 'Music', 'Art', 'Languages',
  'Health', 'Fitness', 'Cooking', 'Travel', 'Gaming', 'Reading'
];

const Profile: React.FC<Props> = ({ activeTab, activeSubNav }) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<IUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    display_name: '', bio: '', location: '', website: '', timezone: '',
    visibility: 'public' as IUserProfile['visibility'],
    social_links: {} as Record<string, string>,
    interests: [] as string[],
  });
  const [newInterest, setNewInterest] = useState('');
  const [achievements, setAchievements] = useState<{ count: number; totalXP: number }>({ count: 0, totalXP: 0 });

  useEffect(() => {
    loadProfile();
  }, [user?.id]);

  const loadProfile = async () => {
    if (!user?.id) return;
    setLoading(true);
    const data = await individualService.getUserProfile(user.id);
    if (data) {
      setProfile(data);
      setEditForm({
        display_name: data.display_name, bio: data.bio || '', location: data.location || '',
        website: data.website || '', timezone: data.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        visibility: data.visibility, social_links: data.social_links || {}, interests: data.interests || [],
      });
    }
    // Load achievements stats
    const achievementData = await individualService.getAchievements(user.id);
    const totalXP = await individualService.getTotalXP(user.id);
    setAchievements({ count: achievementData.length, totalXP });
    setLoading(false);
  };

  const handleSave = async () => {
    const { showToast } = useToast();
    if (!profile) return;

    // Sanitize inputs
    const sanitizedForm = {
      ...editForm,
      display_name: sanitizeText(editForm.display_name),
      bio: editForm.bio ? sanitizeHtml(editForm.bio, 'BASIC') : '',
      location: editForm.location ? sanitizeText(editForm.location) : '',
      website: editForm.website ? sanitizeText(editForm.website) : ''
    };

    // Validate with Zod
    const validationResult = profileSchema.safeParse(sanitizedForm);

    if (!validationResult.success) {
      showToast(`Validation error: ${validationResult.error.issues[0].message}`, 'error');
      return;
    }

    const updated = await individualService.updateUserProfile(profile.id, sanitizedForm);
    if (updated) {
      setProfile(updated);
      setIsEditing(false);
    }
  };

  const addInterest = (interest: string) => {
    if (interest && !editForm.interests.includes(interest) && editForm.interests.length < 15) {
      setEditForm(prev => ({ ...prev, interests: [...prev.interests, interest] }));
      setNewInterest('');
    }
  };

  const removeInterest = (interest: string) => {
    setEditForm(prev => ({ ...prev, interests: prev.interests.filter(i => i !== interest) }));
  };

  const calculateLevel = (xp: number) => {
    return Math.floor(Math.sqrt(xp / 100)) + 1;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-500">Loading profile...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300">Profile not found</h3>
        </div>
      </div>
    );
  }

  const level = calculateLevel(profile.total_xp);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Cover Image */}
      <div 
        className="h-48 md:h-64 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 relative"
        style={profile.cover_image_url ? { backgroundImage: `url(${profile.cover_image_url})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
      >
        <div className="absolute inset-0 bg-black/20" />
        {isEditing && (
          <button className="absolute bottom-4 right-4 px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg flex items-center gap-2 hover:bg-white/30 transition-colors">
            <Camera className="w-4 h-4" />
            Change Cover
          </button>
        )}
      </div>

      <div className="max-w-5xl mx-auto px-6 -mt-20 relative z-10 pb-12">
        {/* Profile Header */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
          <div className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Avatar */}
              <div className="relative mx-auto md:mx-0">
                <div className="w-32 h-32 rounded-full border-4 border-white dark:border-gray-800 shadow-lg overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600">
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt={profile.display_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl text-white font-bold">
                      {profile.display_name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                {isEditing && (
                  <button className="absolute bottom-0 right-0 p-2 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition-colors">
                    <Camera className="w-4 h-4" />
                  </button>
                )}
                {/* Level Badge */}
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-sm font-bold rounded-full shadow-lg">
                  Lvl {level}
                </div>
              </div>

              {/* Profile Info */}
              <div className="flex-1 text-center md:text-left">
                {isEditing ? (
                  <input
                    type="text"
                    value={editForm.display_name}
                    onChange={(e) => setEditForm(prev => ({ ...prev, display_name: e.target.value }))}
                    className="text-2xl font-bold bg-transparent border-b-2 border-indigo-500 focus:outline-none text-gray-900 dark:text-white w-full md:w-auto"
                  />
                ) : (
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">{profile.display_name}</h1>
                )}
                
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                  {profile.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {profile.location}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Joined {new Date(profile.joined_date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </span>
                  <span className="flex items-center gap-1">
                    {profile.visibility === 'public' ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    {profile.visibility === 'public' ? 'Public' : 'Private'}
                  </span>
                </div>

                {isEditing ? (
                  <textarea
                    value={editForm.bio}
                    onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                    placeholder="Tell us about yourself..."
                    rows={3}
                    className="w-full mt-4 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white resize-none"
                  />
                ) : profile.bio ? (
                  <p className="mt-4 text-gray-700 dark:text-gray-300">{profile.bio}</p>
                ) : null}

                {/* Social Links */}
                {!isEditing && Object.keys(profile.social_links || {}).length > 0 && (
                  <div className="flex gap-3 mt-4 justify-center md:justify-start">
                    {SOCIAL_PLATFORMS.map(platform => {
                      const value = profile.social_links?.[platform.key as keyof typeof profile.social_links];
                      if (!value) return null;
                      const Icon = platform.icon;
                      return (
                        <a
                          key={platform.key}
                          href={`https://${platform.key}.com/${value}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        >
                          <Icon className="w-5 h-5" />
                        </a>
                      );
                    })}
                    {profile.website && (
                      <a
                        href={profile.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      >
                        <Globe className="w-5 h-5" />
                      </a>
                    )}
                  </div>
                )}
              </div>

              {/* Edit Button */}
              <div className="flex justify-center md:justify-end">
                {isEditing ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      Save
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center gap-2"
                  >
                    <Edit3 className="w-4 h-4" />
                    Edit Profile
                  </button>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="text-center p-4 rounded-xl bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20">
                <Star className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{profile.total_xp.toLocaleString()}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total XP</div>
              </div>
              <div className="text-center p-4 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
                <Trophy className="w-6 h-6 text-purple-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{achievements.count}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Badges</div>
              </div>
              <div className="text-center p-4 rounded-xl bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20">
                <Zap className="w-6 h-6 text-orange-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{profile.learning_streak}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Day Streak</div>
              </div>
              <div className="text-center p-4 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20">
                <Shield className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{level}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Level</div>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Sections */}
        <AnimatePresence>
          {isEditing && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mt-6 space-y-6"
            >
              {/* Location & Website */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={editForm.location}
                        onChange={(e) => setEditForm(prev => ({ ...prev, location: e.target.value }))}
                        placeholder="City, Country"
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Website</label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="url"
                        value={editForm.website}
                        onChange={(e) => setEditForm(prev => ({ ...prev, website: e.target.value }))}
                        placeholder="https://yourwebsite.com"
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Social Links */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Social Links</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {SOCIAL_PLATFORMS.map(platform => {
                    const Icon = platform.icon;
                    return (
                      <div key={platform.key}>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{platform.label}</label>
                        <div className="relative">
                          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type="text"
                            value={editForm.social_links[platform.key] || ''}
                            onChange={(e) => setEditForm(prev => ({ ...prev, social_links: { ...prev.social_links, [platform.key]: e.target.value } }))}
                            placeholder={platform.placeholder}
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Interests */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Interests</h3>
                <div className="flex flex-wrap gap-2 mb-4">
                  {editForm.interests.map(interest => (
                    <span
                      key={interest}
                      className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-sm flex items-center gap-2"
                    >
                      {interest}
                      <button onClick={() => removeInterest(interest)} className="hover:text-red-500">
                        <X className="w-4 h-4" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={newInterest}
                    onChange={(e) => setNewInterest(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addInterest(newInterest)}
                    placeholder="Add interest..."
                    className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  />
                  <button
                    onClick={() => addInterest(newInterest)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {INTEREST_SUGGESTIONS.filter(s => !editForm.interests.includes(s)).slice(0, 8).map(suggestion => (
                    <button
                      key={suggestion}
                      onClick={() => addInterest(suggestion)}
                      className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      + {suggestion}
                    </button>
                  ))}
                </div>
              </div>

              {/* Privacy */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Privacy Settings</h3>
                <div className="flex gap-4">
                  {(['public', 'private'] as const).map(visibility => (
                    <button
                      key={visibility}
                      onClick={() => setEditForm(prev => ({ ...prev, visibility }))}
                      className={cn(
                        "flex-1 p-4 rounded-xl border-2 transition-all",
                        editForm.visibility === visibility
                          ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
                          : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        {visibility === 'public' ? <Eye className="w-6 h-6 text-indigo-500" /> : <EyeOff className="w-6 h-6 text-gray-500" />}
                        <div className="text-left">
                          <div className="font-semibold text-gray-900 dark:text-white capitalize">{visibility}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {visibility === 'public' ? 'Anyone can view your profile' : 'Only you can view your profile'}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Interests Display (when not editing) */}
        {!isEditing && profile.interests && profile.interests.length > 0 && (
          <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Interests</h3>
            <div className="flex flex-wrap gap-2">
              {profile.interests.map((interest: string) => (
                <span
                  key={interest}
                  className="px-4 py-2 bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-sm font-medium"
                >
                  {interest}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
