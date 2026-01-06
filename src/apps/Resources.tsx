
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon, Card, Button, Badge } from '../components/shared/ui/CommonUI';
import LandingFooter from '../components/layout/LandingFooter';
import { resourceService, Resource } from '../services/resourceService';
import pb from '../lib/pocketbase';

const Resources: React.FC = () => {
  const navigate = useNavigate();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string | undefined>(undefined);

  useEffect(() => {
    fetchResources();
  }, [filterType]);

  const fetchResources = async () => {
    setLoading(true);
    try {
      const result = await resourceService.getResources(filterType);
      setResources(result.items || []);
    } catch (error) {
      console.error('Error fetching resources:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white font-sans overflow-x-hidden animate-fadeIn">
      <header className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 py-4 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
              <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
                  <Icon name="StudioIcon3D" className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  <span className="font-bold text-lg">Resources</span>
              </div>
              <div className="flex gap-4 text-sm font-medium text-gray-600 dark:text-gray-300">
                  <button onClick={() => setFilterType(undefined)} className={!filterType ? 'text-blue-600 dark:text-blue-400' : 'hover:text-blue-600 dark:hover:text-blue-400'}>All</button>
                  <button onClick={() => setFilterType('Guide')} className={filterType === 'Guide' ? 'text-blue-600 dark:text-blue-400' : 'hover:text-blue-600 dark:hover:text-blue-400'}>Guides</button>
                  <button onClick={() => setFilterType('Webinar')} className={filterType === 'Webinar' ? 'text-blue-600 dark:text-blue-400' : 'hover:text-blue-600 dark:hover:text-blue-400'}>Webinars</button>
                  <button onClick={() => setFilterType('Asset')} className={filterType === 'Asset' ? 'text-blue-600 dark:text-blue-400' : 'hover:text-blue-600 dark:hover:text-blue-400'}>Assets</button>
              </div>
          </div>
      </header>

      <section className="bg-blue-600 dark:bg-blue-900 text-white py-20 px-6">
          <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-black mb-6">Grow Your Knowledge</h1>
              <p className="text-xl text-blue-100 dark:text-blue-200 mb-8">Downloadable assets, comprehensive guides, and expert insights to help you master the OS.</p>
              <div className="relative max-w-lg mx-auto">
                  <input type="text" placeholder="Search resources..." className="w-full py-4 pl-6 pr-12 rounded-full text-gray-900 dark:text-white bg-white dark:bg-slate-800 shadow-xl focus:outline-none" />
                  <Icon name="SearchIcon" className="absolute right-4 top-4 w-6 h-6 text-gray-400" />
              </div>
          </div>
      </section>

      <section className="py-20 px-6 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {loading ? (
                  <div className="col-span-full text-center py-12 text-gray-500 dark:text-gray-400">Loading resources...</div>
              ) : resources.length === 0 ? (
                  <div className="col-span-full text-center py-12 text-gray-500 dark:text-gray-400">No resources found.</div>
              ) : (
                  resources.map(resource => (
                  <Card key={resource.id} className="overflow-hidden hover:shadow-xl transition-shadow group cursor-pointer p-0 border border-gray-200 dark:border-slate-700">
                      <div className="h-48 bg-gray-200 dark:bg-slate-700 relative flex items-center justify-center overflow-hidden">
                          {resource.thumbnail ? (
                              <img src={pb.files.getUrl(resource, resource.thumbnail)} alt={resource.title} className="w-full h-full object-cover" />
                          ) : (
                              <>
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 opacity-80 group-hover:scale-105 transition-transform duration-500"></div>
                                <Icon name="DocumentTextIcon" className="w-16 h-16 text-white relative z-10" />
                              </>
                          )}
                      </div>
                      <div className="p-6">
                          <Badge variant="primary" className="mb-2">{resource.type}</Badge>
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{resource.title}</h3>
                          <p className="text-gray-500 dark:text-gray-400 text-sm mb-4 line-clamp-3">{resource.description}</p>
                          {resource.file && (
                              <a 
                                href={pb.files.getUrl(resource, resource.file)} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 dark:text-blue-400 font-bold text-sm flex items-center gap-2 hover:underline"
                              >
                                  Download <Icon name="ArrowDownTrayIcon" className="w-4 h-4" />
                              </a>
                          )}
                      </div>
                  </Card>
              )))}
          </div>
      </section>

      <LandingFooter />
    </div>
  );
};

export default Resources;
    