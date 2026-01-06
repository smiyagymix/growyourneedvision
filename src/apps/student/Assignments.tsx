
import React, { useState, useEffect } from 'react';
import { OwnerIcon } from '../../components/shared/OwnerIcons';
import { Heading1, Heading3, Text } from '../../components/shared/ui/Typography';
import { Card } from '../../components/shared/ui/Card';
import { Button } from '../../components/shared/ui/Button';
import { Badge } from '../../components/shared/ui/Badge';
import { studentService, Assignment as StudentAssignment } from '../../services/studentService';
import { AssignmentRecord, SubmissionRecord } from '../../services/assignmentService'; // Keep types for Modal compatibility
import { SubmitAssignmentModal } from '../../components/shared/modals/SubmitAssignmentModal';
import { AIContentGeneratorModal } from '../../components/shared/modals/AIContentGeneratorModal';
import { useAuth } from '../../context/AuthContext';
import { Icon } from '../../components/shared/ui/CommonUI';
import { fileUploadService } from '../../services/fileUploadService';
import { z } from 'zod';
import { sanitizeText } from '../../utils/sanitization';
import { useToast } from '../../hooks/useToast';

interface AssignmentsProps {
  activeTab: string;
  activeSubNav: string;
}

import { TableSkeleton } from '../../components/shared/ui/DashboardSkeletons';

const StudentAssignments: React.FC<AssignmentsProps> = ({ activeTab, activeSubNav }) => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<StudentAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<StudentAssignment | null>(null);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [aiConfig, setAiConfig] = useState({ title: '', prompt: '', context: {} as any });

  const fetchAssignments = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const assignmentList = await studentService.getAssignments(user.id);
      setAssignments(assignmentList);
    } catch (error) {
      console.error('Error fetching assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, [user]);

  const handleSubmitClick = (assignment: StudentAssignment) => {
    setSelectedAssignment(assignment);
    setIsModalOpen(true);
  };

  const submissionSchema = z.object({
    notes: z.string().max(2000, 'Notes too long').optional(),
    files: z.array(z.any()).optional()
  });

  const handleModalSubmit = async (data: { notes: string; files: File[] }) => {
    if (!selectedAssignment || !user) return;
    const { showToast } = useToast();

    // Sanitize and validate
    const sanitizedNotes = data.notes ? sanitizeText(data.notes) : '';
    const validateResult = submissionSchema.safeParse({ notes: sanitizedNotes, files: data.files });
    if (!validateResult.success) {
      showToast(`Validation error: ${validateResult.error.issues[0].message}`, 'error');
      return;
    }

    // File-level checks
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    const ALLOWED_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'application/zip', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    for (const file of data.files || []) {
      if (file.size > MAX_FILE_SIZE) {
        showToast(`File ${file.name} exceeds the 10MB size limit`, 'error');
        return;
      }
      if (file.type && !ALLOWED_TYPES.includes(file.type)) {
        showToast(`File type not allowed: ${file.name}`, 'error');
        return;
      }
    }

    const previousAssignments = [...assignments];

    // Optimistic UI Update
    setAssignments(prev => prev.map(a =>
      a.id === selectedAssignment.id ? { ...a, status: 'submitted' as any, submission_date: new Date().toISOString() } : a
    ));

    const uploadedFileIds: string[] = [];
    let uploadSuccess = true;
    let uploadErrors: string[] = [];

    try {
      if (data.files.length > 0) {
        for (const file of data.files) {
          try {
            const uploadRecord = await fileUploadService.createFileUpload(file, {
              type: 'assignment_submission',
              uploaded_by: user.id,
              assignment_id: selectedAssignment.id,
              student_id: user.id,
              course_id: selectedAssignment.course_id
            });

            if (uploadRecord.success && uploadRecord.record) {
              uploadedFileIds.push(uploadRecord.record.id);
            } else {
              uploadErrors.push(`${file.name}: ${uploadRecord.error || 'Unknown error'}`);
              uploadSuccess = false;
            }
          } catch (error) {
            uploadErrors.push(`${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            uploadSuccess = false;
          }
        }
      }

      await studentService.submitAssignment(selectedAssignment.id, {
        notes: sanitizedNotes,
        attachments: uploadedFileIds
      });

      setIsModalOpen(false);

      if (!uploadSuccess && data.files.length > 0) {
        showToast(`Partial upload: ${uploadErrors.join('\n')}`, 'warning');
      }
    } catch (error) {
      // Rollback
      setAssignments(previousAssignments);
      showToast('Failed to submit assignment. Please try again.', 'error');
    }
  };

  const handleModalSuccess = async () => {
    await fetchAssignments();
  };

  const handleGetHelp = (assignment: StudentAssignment) => {
    setAiConfig({
      title: `AI Tutor: ${assignment.title}`,
      prompt: `I am a student working on the assignment "${assignment.title}".
          Description: ${assignment.description}
          
          Please explain the key concepts required for this assignment and provide a step-by-step guide on how to approach it. Do not give the final answer.`,
      context: { assignment }
    });
    setIsAIModalOpen(true);
  };

  const getFilteredAssignments = () => {
    return assignments.filter(a => {
      const isSubmitted = a.status === 'submitted' || a.status === 'graded';
      const isOverdue = !isSubmitted && new Date(a.due_date) < new Date();

      if (activeTab === 'Submitted') return isSubmitted;
      if (activeTab === 'Missed') return isOverdue;
      return !isSubmitted && !isOverdue;
    });
  };

  const filteredAssignments = getFilteredAssignments();

  const getModalAssignmentAdapter = (sa: StudentAssignment): AssignmentRecord => {
    return {
      ...sa,
      id: sa.id,
      title: sa.title,
      description: sa.description || '',
      due_date: sa.due_date,
      points: sa.max_grade || 100,
      class_id: sa.course_id,
      teacher_id: '',
      collectionId: sa.collectionId,
      collectionName: sa.collectionName,
      created: sa.created,
      updated: sa.updated
    } as unknown as AssignmentRecord;
  };

  const getModalSubmissionAdapter = (sa: StudentAssignment): SubmissionRecord | undefined => {
    if (sa.status === 'pending') return undefined;
    return {
      id: sa.id,
      assignment_id: sa.id,
      student_id: sa.student,
      submitted_at: sa.submission_date || '',
      grade: sa.grade,
      feedback: sa.feedback,
      notes: '',
      status: sa.status === 'graded' ? 'graded' : 'submitted',
      collectionId: sa.collectionId,
      collectionName: sa.collectionName,
      created: sa.created,
      updated: sa.updated
    } as unknown as SubmissionRecord;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fadeIn p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Heading1 className="text-gray-900 dark:text-white font-black tracking-tight">Assignment Lab</Heading1>
          <Text variant="muted" className="font-bold">
            {activeTab === 'Submitted' && 'Research and review your portfolio'}
            {activeTab === 'Missed' && 'Critical deadlines requiring attention'}
            {activeTab === 'To Do' && 'Active academic challenges'}
          </Text>
        </div>
        <div className="bg-white dark:bg-gray-800 px-4 py-2 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Workspace</p>
          <p className="text-sm font-bold text-gray-900 dark:text-white">{user?.name}</p>
        </div>
      </div>

      {/* Assignments List */}
      {loading ? (
        <TableSkeleton rows={5} />
      ) : filteredAssignments.length === 0 ? (
        <Card className="border-2 border-dashed border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30 rounded-3xl p-20">
          <div className="text-center">
            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700/50 rounded-3xl flex items-center justify-center mx-auto mb-6 transform -rotate-6">
              <OwnerIcon name="DocumentText" className="w-10 h-10 text-gray-300" />
            </div>
            <Heading3 className="text-gray-400 font-bold">No tasks found under "{activeTab}"</Heading3>
            <Text variant="muted" className="mt-2">Keep exploring other sections for work.</Text>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredAssignments.map((assignment) => {
            const isGraded = assignment.status === 'graded';
            const isSubmitted = assignment.status === 'submitted' || isGraded;

            return (
              <Card key={assignment.id} className="p-8 border-none shadow-premium hover:shadow-premium-hover transition-all group relative overflow-hidden">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                        <OwnerIcon name="DocumentText" className="w-7 h-7 text-indigo-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <Heading3 className="!mt-0 font-black text-gray-900 dark:text-white tracking-tight group-hover:text-indigo-600 transition-colors">
                            {assignment.title}
                          </Heading3>
                          <Badge
                            className="font-black rounded-lg uppercase text-[10px] tracking-widest px-3 py-1"
                            variant={isGraded ? 'success' : isSubmitted ? 'info' : 'default'}
                          >
                            {isGraded ? 'Graded' : isSubmitted ? 'Handed In' : 'Outstanding'}
                          </Badge>
                        </div>
                        <p className="text-xs font-black text-gray-400 uppercase tracking-tighter mt-1">{assignment.course_name}</p>
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed max-w-2xl mb-6 font-medium">
                      {assignment.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-6">
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                        <OwnerIcon name="CalendarIcon" className="w-4 h-4 text-orange-500" />
                        <span className="text-xs font-black text-gray-600 dark:text-gray-300">
                          DUE {new Date(assignment.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                        <OwnerIcon name="StarIcon" className="w-4 h-4 text-yellow-500" />
                        <span className="text-xs font-black text-gray-600 dark:text-gray-300">
                          {assignment.max_grade || 100} PTS MAX
                        </span>
                      </div>
                    </div>

                    {isGraded && (
                      <div className="mt-6 p-6 bg-green-50/50 dark:bg-green-900/10 rounded-2xl border border-green-100 dark:border-green-900/30">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-black text-green-900 dark:text-green-400 uppercase tracking-widest">Performance Insight</p>
                          <p className="text-lg font-black text-green-600">{assignment.grade}/{assignment.max_grade}</p>
                        </div>
                        {assignment.feedback && (
                          <p className="text-sm text-green-700 dark:text-green-500/80 font-medium italic">
                            "{assignment.feedback}"
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-row md:flex-col gap-3 min-w-[160px]">
                    {!isSubmitted ? (
                      <>
                        <Button
                          variant="primary"
                          className="font-black rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none py-6"
                          onClick={() => handleSubmitClick(assignment)}
                          leftIcon={<OwnerIcon name="PaperAirplaneIcon" className="w-4 h-4" />}
                        >
                          Submit Work
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="font-black rounded-xl border-2 py-4"
                          onClick={() => handleGetHelp(assignment)}
                          leftIcon={<Icon name="Sparkles" className="w-4 h-4 text-purple-500" />}
                        >
                          Get Tutor Aid
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="outline"
                        className="font-black rounded-xl border-2 py-6 bg-white dark:bg-gray-900"
                        onClick={() => handleSubmitClick(assignment)}
                        leftIcon={<OwnerIcon name={isGraded ? "CheckCircleIcon" : "ClockIcon"} className={`w-4 h-4 ${isGraded ? 'text-green-500' : 'text-blue-500'}`} />}
                      >
                        {isGraded ? 'Review Result' : 'View Hand-in'}
                      </Button>
                    )}
                  </div>
                </div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-transform" />
              </Card>
            );
          })}
        </div>
      )}

      {/* Submit Modal */}
      {user && selectedAssignment && (
        <SubmitAssignmentModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleModalSuccess}
          onSubmit={handleModalSubmit}
          assignment={getModalAssignmentAdapter(selectedAssignment)}
          studentId={user.id}
          existingSubmission={getModalSubmissionAdapter(selectedAssignment)}
        />
      )}

      {selectedAssignment && (
        <AIContentGeneratorModal
          isOpen={isAIModalOpen}
          onClose={() => setIsAIModalOpen(false)}
          onSuccess={() => setIsAIModalOpen(false)}
          title={aiConfig.title}
          promptTemplate={aiConfig.prompt}
          contextData={aiConfig.context}
          placeholder="Ask specific questions about this assignment..."
        />
      )}
    </div>
  );
};

export default StudentAssignments;
