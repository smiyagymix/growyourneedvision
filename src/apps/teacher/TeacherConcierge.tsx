import React, { useState, useEffect } from 'react';
import { RoleBasedAIChat } from '../../components/shared/RoleBasedAIChat';
import { teacherService } from '../../services/teacherService';
import { useAuth } from '../../context/AuthContext';

interface Props {
  activeTab: string;
  activeSubNav: string;
}

const TeacherConcierge: React.FC<Props> = ({ activeTab, activeSubNav }) => {
  const { user } = useAuth();
  const [contextData, setContextData] = useState<string>('');

  useEffect(() => {
    loadContextData();
  }, [user?.id, activeTab]);

  const loadContextData = async () => {
    if (!user) return;
    const teacherId = user.id;

    try {
      let contextParts = [`Current View: ${activeTab} > ${activeSubNav}`];
      contextParts.push(`Teacher Name: ${user.name}`);

      // Load dashboard stats for high-level context
      try {
        const stats = await teacherService.getDashboardStats(teacherId);
        if (stats) {
          contextParts.push(`Total Students: ${stats.total_students}`);
          contextParts.push(`Pending Submissions to Grade: ${stats.pending_submissions}`);
          if (stats.average_class_performance < 75) {
            contextParts.push(`ALERT: Class performance is low (${stats.average_class_performance}%). Suggest remedial actions.`);
          }
        }
      } catch (e) {
        console.error("Failed to load stats for context");
      }

      // Load today's schedule
      try {
        const schedule = await teacherService.getTodaySchedule(teacherId);
        if (schedule.length > 0) {
          const nextClass = schedule[0]; // Assuming sorted
          contextParts.push(`Next Class: ${nextClass.class_name} in room ${nextClass.room} at ${nextClass.start_time}`);
        } else {
          contextParts.push("No classes scheduled for today.");
        }
      } catch (e) {
        console.error("Failed to load schedule for context");
      }

      setContextData(contextParts.join('. '));
    } catch (error) {
      setContextData(`Current View: ${activeTab}. User: ${user.name}`);
    }
  };

  return (
    <div className="h-full p-6">
      <RoleBasedAIChat
        role="teacher"
        context={contextData}
        title="Teaching Assistant"
        subtitle="Lesson planning, grading assistance, and classroom management."
      />
    </div>
  );
};

export default TeacherConcierge;
