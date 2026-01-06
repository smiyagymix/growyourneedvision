import React, { useState, useEffect } from 'react';
import { WidgetErrorBoundary } from '../../components/shared/ui/WidgetErrorBoundary';
import { Icon } from '../../components/shared/ui/CommonUI';
import { individualService, LearningProgress } from '../../services/individualService';
import { useAuth } from '../../context/AuthContext';

interface Props {
  activeTab: string;
  activeSubNav: string;
}

const IndividualLearning: React.FC<Props> = ({ activeTab, activeSubNav }) => {
  const [courses, setCourses] = useState<LearningProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchCourses = async () => {
      if (!user) return;
      setLoading(true);
      const data = await individualService.getLearningProgress(user.id);
      setCourses(data);
      setLoading(false);
    };
    fetchCourses();
  }, [user]);

  return (
    <div className="animate-fadeIn space-y-6">
      <div className="flex items-center justify-between border-b border-gray-200/50 pb-4">
        <div>
            <h2 className="text-2xl font-black text-gyn-blue-dark dark:text-white">{activeTab}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Expand your skills and knowledge.</p>
        </div>
        <button className="bg-gyn-blue-medium text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md hover:bg-gyn-blue-dark transition-colors">
            Browse Catalog
        </button>
      </div>
      
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading courses...</div>
      ) : courses.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No courses found.</div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {courses.map((course) => (
              <div key={course.id} className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-white/50 dark:border-slate-700 rounded-2xl shadow-glass-edge overflow-hidden group hover:shadow-lg transition-all cursor-pointer">
                  <div className={`h-32 bg-gradient-to-br from-blue-400 to-blue-600 relative p-6 flex items-end`}>
                      <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md px-2 py-1 rounded text-xs text-white font-bold">Course</div>
                  </div>
                  <div className="p-6">
                      <h3 className="font-bold text-lg text-gray-800 dark:text-white mb-1">{course.course_name}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Last accessed: {new Date(course.last_accessed).toLocaleDateString()}</p>
                      
                      <div className="flex justify-between text-xs mb-1">
                          <span className="font-bold text-gray-500 dark:text-gray-400">{course.status}</span>
                          <span className={`font-bold text-blue-600 dark:text-blue-400`}>{course.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden mb-4">
                          <div className={`h-full bg-blue-500 rounded-full`} style={{ width: `${course.progress}%` }}></div>
                      </div>
                      
                      <button className={`w-full py-2 rounded-lg text-xs font-bold transition-colors ${course.progress > 0 ? 'bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'}`}>
                          {course.progress > 0 ? 'Continue Learning' : 'Start Course'}
                      </button>
                  </div>
              </div>
          ))}
      </div>
      )}
    </div>
  );
};

export default IndividualLearning;
