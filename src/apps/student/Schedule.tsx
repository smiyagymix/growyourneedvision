
import React, { useState, useEffect } from 'react';
import { Icon, Card } from '../../components/shared/ui/CommonUI';
import { useAuth } from '../../context/AuthContext';
import { studentService, Course } from '../../services/studentService';

interface Props {
  activeTab: string;
  activeSubNav: string;
}

const StudentSchedule: React.FC<Props> = ({ activeTab }) => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSchedule = async () => {
      if (!user) return;
      setLoading(true);
      try {
        // We derive schedule from courses since student_schedule might not be populated separately
        const data = await studentService.getCourses(user.id);
        setCourses(data);
      } catch (err) {
        console.error("Failed to load schedule from courses", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSchedule();
  }, [user]);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  const getClassesForDay = (day: string) => {
    const dayClasses: any[] = [];

    courses.forEach(course => {
      // Check standard schedule prop or data.schedule (if seeded in JSON)
      // Adjust logic to match how seed-data.js structured it (day full name vs short?)
      // Seed data used "Mon", "Tue". UI uses "Monday".

      const scheduleItems = Array.isArray(course.schedule) && course.schedule.length > 0
        ? course.schedule
        : (course.data?.schedule as any[] || []);

      scheduleItems.forEach(item => {
        // Simple mapping for Mon/Monday
        const normalizeDay = (d: string) => {
          if (d === 'Mon') return 'Monday';
          if (d === 'Tue') return 'Tuesday';
          if (d === 'Wed') return 'Wednesday';
          if (d === 'Thu') return 'Thursday';
          if (d === 'Fri') return 'Friday';
          return d;
        };

        if (normalizeDay(item.day) === day) {
          dayClasses.push({
            name: course.title, // course title
            time: item.time,
            room: item.room,
            teacher: course.teacher_name
          });
        }
      });
    });

    return dayClasses.sort((a, b) => a.time.localeCompare(b.time));
  };

  return (
    <div className="animate-fadeIn space-y-6">
      <div className="flex items-center justify-between border-b border-gray-200/50 pb-4">
        <div>
          <h2 className="text-2xl font-black text-gyn-blue-dark dark:text-white">{activeTab}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Your weekly class schedule.</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading schedule...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {days.map(day => {
            const dayClasses = getClassesForDay(day);
            return (
              <div key={day} className="space-y-4">
                <h3 className="font-bold text-center text-gray-500 uppercase text-xs tracking-wider bg-gray-100 dark:bg-slate-800 py-2 rounded-lg">{day}</h3>
                {dayClasses.length === 0 ? (
                  <div className="text-center text-xs text-gray-400 py-4 border border-dashed border-gray-200 dark:border-slate-700 rounded-lg">No classes</div>
                ) : (
                  dayClasses.map((c, i) => (
                    <Card key={i} className="p-4 hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-blue-500 group">
                      <div className="text-xs text-gray-400 font-mono mb-1 flex items-center gap-1">
                        <Icon name="ClockIcon" className="w-3 h-3" />
                        {c.time}
                      </div>
                      <div className="font-bold text-gray-800 dark:text-white text-sm mb-1">{c.name}</div>
                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        <Icon name="MapPinIcon" className="w-3 h-3" />
                        {c.room}
                      </div>
                      {c.teacher && (
                        <div className="text-xs text-gray-400 mt-2 pt-2 border-t border-gray-100 dark:border-slate-700 flex items-center gap-1">
                          <Icon name="UserIcon" className="w-3 h-3" />
                          {c.teacher}
                        </div>
                      )}
                    </Card>
                  ))
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StudentSchedule;
