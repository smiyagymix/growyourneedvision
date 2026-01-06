import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import pb from '../../lib/pocketbase';
import { Icon } from '../../components/shared/ui/CommonUI';
import { z } from 'zod';
import { sanitizeText } from '../../utils/sanitization';
import { useToast } from '../../hooks/useToast';

const taskSchema = z.object({
  content: z.string().min(1, 'Task cannot be empty').max(500, 'Task too long')
});

export const TasksTool: React.FC = () => {
    const queryClient = useQueryClient();
    const { data: tasks, isLoading: loadingTasks } = useQuery({
        queryKey: ['tasks'],
        queryFn: async () => await pb.collection('tasks').getFullList({ sort: '-created' })
    });

    const createTaskMutation = useMutation({
        mutationFn: async (content: string) => {
            return await pb.collection('tasks').create({
                content,
                user: pb.authStore.model?.id,
                completed: false
            });
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] })
    });

    const toggleTaskMutation = useMutation({
        mutationFn: async ({ id, completed }: { id: string, completed: boolean }) => {
            return await pb.collection('tasks').update(id, { completed });
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] })
    });

    const deleteTaskMutation = useMutation({
        mutationFn: async (id: string) => await pb.collection('tasks').delete(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] })
    });

    const [newTaskContent, setNewTaskContent] = useState('');

    const handleAddTask = (e: React.FormEvent) => {
        e.preventDefault();
        const { showToast } = useToast();

        // Sanitize
        const sanitized = sanitizeText(newTaskContent);

        // Validate
        const result = taskSchema.safeParse({ content: sanitized });
        if (!result.success) {
            showToast(`Validation error: ${result.error.issues[0].message}`, 'error');
            return;
        }

        createTaskMutation.mutate(result.data.content);
        setNewTaskContent('');
    };

    return (
        <div className="h-full flex flex-col gap-4 animate-fadeIn">
            <div className="flex justify-between items-center">
                <h3 className="text-gray-400 font-bold text-sm">My Tasks</h3>
                <span className="text-xs text-gray-500">{tasks?.filter((t: any) => !t.completed).length || 0} pending</span>
            </div>

            <form onSubmit={handleAddTask} className="flex gap-2">
                <input
                    type="text"
                    value={newTaskContent}
                    onChange={(e) => setNewTaskContent(e.target.value)}
                    placeholder="Add a new task..."
                    className="flex-1 bg-[#161825] border border-[#2a2d3d] rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
                <button
                    type="submit"
                    disabled={createTaskMutation.isPending || !newTaskContent.trim()}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 rounded-lg font-bold text-sm transition-colors disabled:opacity-50"
                >
                    {createTaskMutation.isPending ? 'Adding...' : 'Add'}
                </button>
            </form>

            <div className="flex-1 bg-[#161825] border border-[#2a2d3d] rounded-lg overflow-y-auto p-2">
                {loadingTasks ? (
                    <div className="text-center text-gray-500 py-8">Loading tasks...</div>
                ) : tasks?.length === 0 ? (
                    <div className="text-center text-gray-500 py-12 flex flex-col items-center gap-2">
                        <Icon name="CheckCircleIcon" className="w-8 h-8 opacity-20" />
                        <p>No tasks found. Get started!</p>
                    </div>
                ) : (
                    <div className="space-y-1">
                        {tasks?.map((task: any) => (
                            <div
                                key={task.id}
                                className={`group flex items-center gap-3 p-3 rounded-lg border border-transparent transition-all ${task.completed ? 'bg-transparent opacity-50' : 'bg-[#0f111a] hover:border-[#2a2d3d]'}`}
                            >
                                <button
                                    onClick={() => toggleTaskMutation.mutate({ id: task.id, completed: !task.completed })}
                                    className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${task.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-600 hover:border-emerald-500'}`}
                                >
                                    {task.completed && <Icon name="CheckIcon" className="w-3 h-3" />}
                                </button>
                                <span className={`flex-1 text-sm ${task.completed ? 'line-through text-gray-500' : 'text-gray-200'}`}>
                                    {task.content}
                                </span>
                                <button
                                    onClick={() => deleteTaskMutation.mutate(task.id)}
                                    className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition-opacity p-1"
                                >
                                    <Icon name="TrashIcon" className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
