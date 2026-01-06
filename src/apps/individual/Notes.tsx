import React, { useState, useEffect } from 'react';
import { WidgetErrorBoundary } from '../../components/shared/ui/WidgetErrorBoundary';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, Plus, Search, Pin, Star, Trash2, Edit3, 
  Tag, Folder, MoreHorizontal, X, Save, Calendar
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { individualService, Note } from '../../services/individualService';
import { cn } from '../../lib/utils';
import { sanitizeText, sanitizeHtml } from '../../utils/sanitization';
import { noteSchema } from '../../validation/schemas';

interface Props {
  activeTab?: string;
  activeSubNav?: string;
}

const CATEGORIES: { value: Note['category']; label: string; icon: string; color: string }[] = [
  { value: 'general', label: 'General', icon: '📝', color: 'bg-gray-500' },
  { value: 'idea', label: 'Ideas', icon: '💡', color: 'bg-yellow-500' },
  { value: 'project', label: 'Project', icon: '📔', color: 'bg-purple-500' },
  { value: 'personal', label: 'Personal', icon: '🏠', color: 'bg-green-500' },
  { value: 'learning', label: 'Learning', icon: '📚', color: 'bg-orange-500' },
];

const NOTE_COLORS = [
  { value: undefined, label: 'Default', bg: 'bg-white dark:bg-gray-800' },
  { value: '#fef3c7', label: 'Yellow', bg: 'bg-yellow-100' },
  { value: '#dbeafe', label: 'Blue', bg: 'bg-blue-100' },
  { value: '#dcfce7', label: 'Green', bg: 'bg-green-100' },
  { value: '#fce7f3', label: 'Pink', bg: 'bg-pink-100' },
  { value: '#e0e7ff', label: 'Indigo', bg: 'bg-indigo-100' },
];

const Notes: React.FC<Props> = ({ activeTab, activeSubNav }) => {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Note['category'] | null>(null);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showNewNote, setShowNewNote] = useState(false);
  const [editForm, setEditForm] = useState({ title: '', content: '', category: 'general' as Note['category'], tags: '' as string, color: undefined as string | undefined });

  useEffect(() => {
    loadNotes();
  }, [user?.id, selectedCategory]);

  const loadNotes = async () => {
    if (!user?.id) return;
    setLoading(true);
    const data = await individualService.getNotes(user.id, selectedCategory || undefined);
    setNotes(data);
    setLoading(false);
  };

  const { showToast } = useToast();

  const handleCreateNote = async () => {
    if (!user?.id || !editForm.title.trim()) return;

    // Sanitize inputs to prevent XSS
    const sanitizedData = {
      title: sanitizeText(editForm.title),
      content: sanitizeHtml(editForm.content, 'RICH'),
      category: editForm.category,
      tags: editForm.tags.split(',').map(t => sanitizeText(t.trim())).filter(Boolean),
      color: editForm.color,
    };

    // Validate with Zod
    const validationResult = noteSchema.safeParse({
      userId: user.id,
      ...sanitizedData
    });

    if (!validationResult.success) {
      showToast(`Validation error: ${validationResult.error.issues[0].message}`, 'error');
      return;
    }

    const note = await individualService.createNote(user.id, sanitizedData);
    if (note) {
      setNotes(prev => [note, ...prev]);
      setShowNewNote(false);
      setEditForm({ title: '', content: '', category: 'general', tags: '', color: undefined });
    }
  };

  const handleUpdateNote = async () => {
    if (!selectedNote) return;
    const updated = await individualService.updateNote(selectedNote.id, {
      title: editForm.title,
      content: editForm.content,
      category: editForm.category,
      tags: editForm.tags.split(',').map(t => t.trim()).filter(Boolean),
      color: editForm.color,
    });
    if (updated) {
      setNotes(prev => prev.map(n => n.id === updated.id ? updated : n));
      setSelectedNote(updated);
      setIsEditing(false);
    }
  };

  const handleTogglePin = async (note: Note) => {
    const updated = await individualService.updateNote(note.id, { is_pinned: !note.is_pinned });
    if (updated) {
      setNotes(prev => prev.map(n => n.id === updated.id ? updated : n).sort((a, b) => {
        if (a.is_pinned && !b.is_pinned) return -1;
        if (!a.is_pinned && b.is_pinned) return 1;
        return 0;
      }));
      if (selectedNote?.id === note.id) setSelectedNote(updated);
    }
  };

  const handleToggleFavorite = async (note: Note) => {
    const updated = await individualService.updateNote(note.id, { is_favorite: !note.is_favorite });
    if (updated) {
      setNotes(prev => prev.map(n => n.id === updated.id ? updated : n));
      if (selectedNote?.id === note.id) setSelectedNote(updated);
    }
  };

  const handleDelete = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return;
    const success = await individualService.deleteNote(noteId);
    if (success) {
      setNotes(prev => prev.filter(n => n.id !== noteId));
      if (selectedNote?.id === noteId) setSelectedNote(null);
    }
  };

  const filteredNotes = notes.filter(note => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return note.title.toLowerCase().includes(query) || 
           note.content.toLowerCase().includes(query) ||
           note.tags?.some(t => t.toLowerCase().includes(query));
  });

  const startEdit = (note: Note) => {
    setEditForm({
      title: note.title,
      content: note.content,
      category: note.category,
      tags: note.tags?.join(', ') || '',
      color: note.color,
    });
    setIsEditing(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <FileText className="w-8 h-8 text-indigo-500" />
              Notes & Journal
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Capture your thoughts, ideas, and reflections
            </p>
          </div>
          <button
            onClick={() => { setShowNewNote(true); setEditForm({ title: '', content: '', category: 'general', tags: '', color: undefined }); }}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            New Note
          </button>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setSelectedCategory(null)}
              className={cn(
                "px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2",
                !selectedCategory ? "bg-indigo-600 text-white" : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              )}
            >
              <Folder className="w-4 h-4" />
              All Notes
            </button>
            {CATEGORIES.map(cat => (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={cn(
                  "px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1",
                  selectedCategory === cat.value ? "bg-indigo-600 text-white" : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                )}
              >
                <span>{cat.icon}</span>
                <span className="hidden sm:inline">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Notes List */}
          <div className="lg:col-span-1 space-y-3 max-h-[calc(100vh-280px)] overflow-y-auto">
            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading notes...</div>
            ) : filteredNotes.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">No notes found</p>
                <button
                  onClick={() => setShowNewNote(true)}
                  className="mt-4 text-indigo-600 hover:underline"
                >
                  Create your first note
                </button>
              </div>
            ) : (
              filteredNotes.map(note => (
                <motion.div
                  key={note.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => { setSelectedNote(note); setIsEditing(false); }}
                  className={cn(
                    "p-4 rounded-xl cursor-pointer transition-all border-2",
                    selectedNote?.id === note.id 
                      ? "border-indigo-500 shadow-lg" 
                      : "border-transparent hover:border-gray-200 dark:hover:border-gray-700",
                    note.color ? '' : 'bg-white dark:bg-gray-800'
                  )}
                  style={note.color ? { backgroundColor: note.color } : {}}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {note.is_pinned && <Pin className="w-4 h-4 text-indigo-500 flex-shrink-0" />}
                        {note.is_favorite && <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 flex-shrink-0" />}
                        <span className="text-sm">{CATEGORIES.find(c => c.value === note.category)?.icon}</span>
                      </div>
                      <h3 className={cn(
                        "font-semibold truncate",
                        note.color ? "text-gray-800" : "text-gray-900 dark:text-white"
                      )}>
                        {note.title}
                      </h3>
                      <p className={cn(
                        "text-sm line-clamp-2 mt-1",
                        note.color ? "text-gray-600" : "text-gray-600 dark:text-gray-400"
                      )}>
                        {note.content}
                      </p>
                      {note.tags && note.tags.length > 0 && (
                        <div className="flex gap-1 mt-2 flex-wrap">
                          {note.tags.slice(0, 3).map(tag => (
                            <span key={tag} className="px-2 py-0.5 text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className={cn(
                    "flex items-center gap-2 mt-3 text-xs",
                    note.color ? "text-gray-500" : "text-gray-500 dark:text-gray-500"
                  )}>
                    <Calendar className="w-3 h-3" />
                    {new Date(note.created).toLocaleDateString()}
                  </div>
                </motion.div>
              ))
            )}
          </div>

          {/* Note Detail / Editor */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              {showNewNote ? (
                <motion.div
                  key="new-note"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">New Note</h2>
                    <button onClick={() => setShowNewNote(false)} className="p-2 text-gray-400 hover:text-gray-600">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <input
                      type="text"
                      placeholder="Note title..."
                      value={editForm.title}
                      onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-4 py-2 text-xl font-semibold border-0 border-b-2 border-gray-200 dark:border-gray-700 bg-transparent text-gray-900 dark:text-white focus:ring-0 focus:border-indigo-500"
                    />
                    
                    <textarea
                      placeholder="Start writing..."
                      value={editForm.content}
                      onChange={(e) => setEditForm(prev => ({ ...prev, content: e.target.value }))}
                      rows={12}
                      className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 resize-none"
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                        <select
                          value={editForm.category}
                          onChange={(e) => setEditForm(prev => ({ ...prev, category: e.target.value as Note['category'] }))}
                          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        >
                          {CATEGORIES.map(cat => (
                            <option key={cat.value} value={cat.value}>{cat.icon} {cat.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tags (comma separated)</label>
                        <input
                          type="text"
                          placeholder="tag1, tag2, tag3"
                          value={editForm.tags}
                          onChange={(e) => setEditForm(prev => ({ ...prev, tags: e.target.value }))}
                          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Color</label>
                      <div className="flex gap-2">
                        {NOTE_COLORS.map(color => (
                          <button
                            key={color.label}
                            onClick={() => setEditForm(prev => ({ ...prev, color: color.value }))}
                            className={cn(
                              "w-8 h-8 rounded-full border-2 transition-all",
                              color.bg,
                              editForm.color === color.value ? "border-indigo-500 scale-110" : "border-gray-300"
                            )}
                          />
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex gap-3 justify-end">
                      <button
                        onClick={() => setShowNewNote(false)}
                        className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleCreateNote}
                        disabled={!editForm.title.trim()}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
                      >
                        <Save className="w-4 h-4" />
                        Save Note
                      </button>
                    </div>
                  </div>
                </motion.div>
              ) : selectedNote ? (
                <motion.div
                  key={selectedNote.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
                  style={selectedNote.color && !isEditing ? { backgroundColor: selectedNote.color } : {}}
                >
                  {isEditing ? (
                    <div className="space-y-4">
                      <input
                        type="text"
                        value={editForm.title}
                        onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                        className="w-full px-4 py-2 text-xl font-semibold border-0 border-b-2 border-gray-200 dark:border-gray-700 bg-transparent text-gray-900 dark:text-white focus:ring-0 focus:border-indigo-500"
                      />
                      
                      <textarea
                        value={editForm.content}
                        onChange={(e) => setEditForm(prev => ({ ...prev, content: e.target.value }))}
                        rows={12}
                        className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 resize-none"
                      />
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <select
                          value={editForm.category}
                          onChange={(e) => setEditForm(prev => ({ ...prev, category: e.target.value as Note['category'] }))}
                          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        >
                          {CATEGORIES.map(cat => (
                            <option key={cat.value} value={cat.value}>{cat.icon} {cat.label}</option>
                          ))}
                        </select>
                        <input
                          type="text"
                          placeholder="Tags (comma separated)"
                          value={editForm.tags}
                          onChange={(e) => setEditForm(prev => ({ ...prev, tags: e.target.value }))}
                          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
                      </div>

                      <div className="flex gap-2">
                        {NOTE_COLORS.map(color => (
                          <button
                            key={color.label}
                            onClick={() => setEditForm(prev => ({ ...prev, color: color.value }))}
                            className={cn(
                              "w-8 h-8 rounded-full border-2 transition-all",
                              color.bg,
                              editForm.color === color.value ? "border-indigo-500 scale-110" : "border-gray-300"
                            )}
                          />
                        ))}
                      </div>
                      
                      <div className="flex gap-3 justify-end">
                        <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-gray-600 dark:text-gray-400">
                          Cancel
                        </button>
                        <button onClick={handleUpdateNote} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2">
                          <Save className="w-4 h-4" />
                          Save Changes
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-lg">{CATEGORIES.find(c => c.value === selectedNote.category)?.icon}</span>
                            <span className={cn(
                              "text-sm px-2 py-0.5 rounded-full",
                              selectedNote.color ? "bg-white/50" : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                            )}>
                              {CATEGORIES.find(c => c.value === selectedNote.category)?.label}
                            </span>
                          </div>
                          <h2 className={cn(
                            "text-2xl font-bold",
                            selectedNote.color ? "text-gray-800" : "text-gray-900 dark:text-white"
                          )}>
                            {selectedNote.title}
                          </h2>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleTogglePin(selectedNote)}
                            className={cn(
                              "p-2 rounded-lg transition-colors",
                              selectedNote.is_pinned ? "bg-indigo-100 text-indigo-600" : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400"
                            )}
                          >
                            <Pin className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleToggleFavorite(selectedNote)}
                            className={cn(
                              "p-2 rounded-lg transition-colors",
                              selectedNote.is_favorite ? "bg-yellow-100 text-yellow-600" : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400"
                            )}
                          >
                            <Star className={cn("w-5 h-5", selectedNote.is_favorite && "fill-yellow-500")} />
                          </button>
                          <button
                            onClick={() => startEdit(selectedNote)}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400"
                          >
                            <Edit3 className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(selectedNote.id)}
                            className="p-2 rounded-lg hover:bg-red-100 text-gray-400 hover:text-red-600"
                            title="Delete note"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                          <button
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400"
                            title="More options"
                          >
                            <MoreHorizontal className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                      
                      <div className={cn(
                        "prose dark:prose-invert max-w-none whitespace-pre-wrap mb-6",
                        selectedNote.color ? "text-gray-700" : ""
                      )}>
                        {selectedNote.content || <span className="text-gray-400 italic">No content</span>}
                      </div>
                      
                      {selectedNote.tags && selectedNote.tags.length > 0 && (
                        <div className="flex gap-2 flex-wrap mb-4">
                          {selectedNote.tags.map(tag => (
                            <span key={tag} className={cn(
                              "px-3 py-1 text-sm rounded-full flex items-center gap-1",
                              selectedNote.color ? "bg-white/50 text-gray-700" : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                            )}>
                              <Tag className="w-3 h-3" />
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      <div className={cn(
                        "text-sm pt-4 border-t",
                        selectedNote.color ? "border-gray-300/50 text-gray-500" : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-500"
                      )}>
                        Created {new Date(selectedNote.created).toLocaleString()}
                        {selectedNote.updated && ` • Updated ${new Date(selectedNote.updated).toLocaleString()}`}
                      </div>
                    </>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-white dark:bg-gray-800 rounded-xl p-12 shadow-lg text-center"
                >
                  <FileText className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Select a note to view
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Choose a note from the list or create a new one
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notes;
