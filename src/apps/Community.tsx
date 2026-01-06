
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon, Card, Button, Badge, Avatar } from '../components/shared/ui/CommonUI';
import LandingFooter from '../components/layout/LandingFooter';
import { communityService, Post } from '../services/communityService';
import { AIContentGeneratorModal } from '../components/shared/modals/AIContentGeneratorModal';
import pb from '../lib/pocketbase';

const Community: React.FC = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const result = await communityService.getPosts();
      setPosts(result.items || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
        await communityService.likePost(id);
        // Optimistic update or refetch
        setPosts(posts.map(p => p.id === id ? { ...p, likes: p.likes + 1 } : p));
    } catch (error) {
        console.error('Error liking post:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 font-sans animate-fadeIn text-gray-800 dark:text-white">
      {/* Header */}
      <div className="bg-indigo-600 dark:bg-indigo-900 text-white py-20 px-6 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
          <div className="relative z-10">
              <button onClick={() => navigate('/')} className="absolute top-4 left-4 text-xs font-bold opacity-70 hover:opacity-100 flex items-center gap-1">
                  <Icon name="ArrowLeftIcon" className="w-3 h-3" /> HOME
              </button>
              <h1 className="text-4xl md:text-6xl font-black mb-4">Global Community</h1>
              <p className="text-indigo-100 dark:text-indigo-200 text-xl max-w-2xl mx-auto">Connect with 50,000+ educators, developers, and creators building on Grow Your Need.</p>
              <div className="mt-8 flex justify-center gap-4">
                  <Button variant="secondary" className="bg-white text-indigo-600 hover:bg-indigo-50 border-none">Join Discord</Button>
                  <Button variant="outline" className="border-indigo-400 text-white hover:bg-indigo-500">Browse Forums</Button>
              </div>
          </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Feed */}
              <div className="lg:col-span-2 space-y-6">
                  <div className="flex justify-between items-center mb-4">
                      <h2 className="text-xl font-bold text-gray-800 dark:text-white">Trending Discussions</h2>
                      <div className="flex gap-2">
                        <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setIsAIModalOpen(true)}
                            className="flex items-center gap-1 text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                        >
                            <Icon name="Sparkles" className="w-4 h-4" /> Draft Post
                        </Button>
                        <select className="bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg px-3 py-1 text-sm text-gray-800 dark:text-white"><option>Latest</option><option>Top</option></select>
                      </div>
                  </div>
                  
                  {loading ? (
                      <div className="text-center py-12 text-gray-500 dark:text-gray-400">Loading discussions...</div>
                  ) : posts.length === 0 ? (
                      <div className="text-center py-12 text-gray-500 dark:text-gray-400">No discussions found. Be the first to post!</div>
                  ) : (
                      posts.map(post => (
                      <Card key={post.id} className="p-6 hover:shadow-md transition-shadow cursor-pointer">
                          <div className="flex gap-4">
                              <div className="flex flex-col items-center gap-1">
                                  <button 
                                    onClick={(e) => handleLike(post.id, e)}
                                    className="text-gray-400 dark:text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400"
                                  >
                                      <Icon name="ChevronUpIcon" className="w-5 h-5" />
                                  </button>
                                  <span className="font-bold text-gray-700 dark:text-gray-300">{post.likes}</span>
                              </div>
                              <div>
                                  <h3 className="font-bold text-lg text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 mb-1">{post.title}</h3>
                                  <p className="text-gray-500 dark:text-gray-400 text-sm line-clamp-2 mb-3">{post.content}</p>
                                  <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
                                      <div className="flex items-center gap-1">
                                          <Avatar 
                                            src={post.expand?.author?.avatar ? pb.files.getUrl(post.expand.author, post.expand.author.avatar) : undefined} 
                                            initials={(post.expand?.author?.name || 'U').charAt(0)}
                                            size="sm"
                                          />
                                          <span>@{post.expand?.author?.name || 'User'}</span>
                                      </div>
                                      <span>•</span>
                                      <span>{new Date(post.created).toLocaleDateString()}</span>
                                      {post.tags && post.tags.length > 0 && (
                                          <>
                                            <span>•</span>
                                            <Badge variant="neutral" className="text-[10px] py-0">{post.tags[0]}</Badge>
                                          </>
                                      )}
                                  </div>
                              </div>
                          </div>
                      </Card>
                  )))}
              </div>

              {/* Sidebar */}
              <div className="space-y-8">
                  <Card className="p-6">
                      <h3 className="font-bold text-gray-800 dark:text-white mb-4">Upcoming Events</h3>
                      <div className="space-y-4">
                          {[1, 2].map(i => (
                              <div key={i} className="flex gap-3">
                                  <div className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg p-2 text-center min-w-[50px]">
                                      <div className="text-xs font-bold uppercase">OCT</div>
                                      <div className="text-xl font-black">{12 + i}</div>
                                  </div>
                                  <div>
                                      <h4 className="font-bold text-sm text-gray-900 dark:text-white">Developer Town Hall</h4>
                                      <p className="text-xs text-gray-500 dark:text-gray-400">Live Q&A with the core team.</p>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </Card>

                  <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl p-6 text-white shadow-lg">
                      <h3 className="font-bold text-lg mb-2">Become a Champion</h3>
                      <p className="text-sm opacity-90 mb-4">Contribute to the docs, answer questions, and earn exclusive badges.</p>
                      <Button variant="outline" className="w-full border-white/30 text-white hover:bg-white/10">Learn More</Button>
                  </div>
              </div>
          </div>
      </div>
      <LandingFooter />

      <AIContentGeneratorModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        onSuccess={(content) => {
            console.log("Draft Post:", content);
            setIsAIModalOpen(false);
            alert("Post Drafted! (Check console)");
        }}
        title="Draft Community Post"
        promptTemplate={`Write a community forum post about [Topic].
        
        Structure:
        - Engaging Title
        - Problem/Question/Observation
        - Call for discussion/feedback
        
        Tone: Helpful and Collaborative.`}
        contextData={{}}
      />
    </div>
  );
};

export default Community;
    