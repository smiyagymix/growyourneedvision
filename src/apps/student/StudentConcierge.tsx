import React, { useState, useEffect } from 'react';
import { RoleBasedAIChat } from '../../components/shared/RoleBasedAIChat';
import pb from '../../lib/pocketbase';
import { useAuth } from '../../context/AuthContext';
import { isMockEnv } from '../../utils/mockData';

interface Props {
  activeTab: string;
  activeSubNav: string;
}

const StudentConcierge: React.FC<Props> = ({ activeTab, activeSubNav }) => {
  const { user } = useAuth();
  const [contextData, setContextData] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContextData();
  }, [user?.id, activeTab]);

  const loadContextData = async () => {
    if (!user) return;
    setLoading(true);

    try {
      let contextParts = [`Current View: ${activeTab} > ${activeSubNav}`];
      contextParts.push(`Student Name: ${user.name}`);

      if (isMockEnv()) {
        contextParts.push("Upcoming Assignments: History Essay (Due Tomorrow), Math Homework (Due Friday)");
        contextParts.push("Recent Grades: Math (95%), Science (88%)");
      } else {
        // Load upcoming assignments
        try {
          const assignments = await pb.collection('assignments').getList(1, 3, {
            filter: `due_date >= "${new Date().toISOString()}"`,
            sort: 'due_date',
            expand: 'subject'
          });

          if (assignments.items.length > 0) {
            const assignmentList = assignments.items.map(a =>
              `${a.title} (${a.expand?.subject?.name || 'Subject'}) due ${new Date(a.due_date).toLocaleDateString()}`
            ).join(', ');
            contextParts.push(`Upcoming Assignments: ${assignmentList}`);
          } else {
            contextParts.push("No upcoming assignments.");
          }
        } catch (e) {
          console.error("Failed to load assignments for context");
        }

        // Load recent grades
        try {
          const grades = await pb.collection('submissions').getList(1, 3, {
            filter: `student = "${user.id}" && grade != null`,
            sort: '-updated',
            expand: 'assignment'
          });

          if (grades.items.length > 0) {
            const gradeList = grades.items.map(g =>
              `${g.expand?.assignment?.title}: ${g.grade}%`
            ).join(', ');
            contextParts.push(`Recent Grades: ${gradeList}`);
          }
        } catch (e) {
          console.error("Failed to load grades for context");
        }
      }

      setContextData(contextParts.join('. '));
    } catch (error) {
      console.error("Error building AI context:", error);
      setContextData(`Current View: ${activeTab}. User: ${user.name}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full p-6">
      <RoleBasedAIChat
        role="student"
        context={contextData}
        title="Study Buddy"
        subtitle="Your personal AI tutor and homework helper."
      />
    </div>
  );
};

export default StudentConcierge;
