import React, { useState, useEffect, useRef } from 'react';
import { TasksTool } from './tools/TasksTool';
import { CalendarTool } from './tools/CalendarTool';
import { useFileStorage } from '../hooks/useFileStorage';
import { FileTree } from '../components/shared/ui/FileTree';
import { Icon } from '../components/shared/ui/CommonUI';
import { Button } from '../components/shared/ui/Button';
import { Input } from '../components/shared/ui/Input';
import { Select } from '../components/shared/ui/Select';
import { Badge } from '../components/shared/ui/Badge';
import { Table, Thead, Tr, Th, Td } from '../components/shared/ui/Table';

import { ResourcesView } from './tools/ResourcesView';
import { ReportsApp } from './ReportsApp';
import pb from '../lib/pocketbase';
import { auditAdminService, type AuditLogRecord } from '../services/auditAdminService';
import { useToast } from '../hooks/useToast';

interface ToolsProps {
    activeTab: string;
    activeSubNav: string;
}

const Tools: React.FC<ToolsProps> = ({ activeTab, activeSubNav }) => {
    const [activeTool, setActiveTool] = useState('JSON Formatter');

    // Sync activeTool with activeSubNav
    useEffect(() => {
        if (activeSubNav && activeSubNav !== 'Overview') {
            setActiveTool(activeSubNav);
        } else {
            // Set default tool based on tab
            if (activeTab === 'Classroom') setActiveTool('Whiteboard');
            else if (activeTab === 'Productivity') setActiveTool('Notes');
            else if (activeTab === 'Notes') setActiveTool('Notes');
            else if (activeTab === 'Flashcards') setActiveTool('Flashcards');
            else if (activeTab === 'Timer') setActiveTool('Timer');
            else setActiveTool('JSON Formatter');
        }
    }, [activeSubNav, activeTab]);

    // --- File Manager State ---
    const { files, loading: filesLoading, createFolder, uploadFile, deleteItem, error: fileError } = useFileStorage();
    const [newFolderName, setNewFolderName] = useState('');
    const [isCreatingFolder, setIsCreatingFolder] = useState(false);

    // --- Dev Tools State ---
    const [jsonInput, setJsonInput] = useState('');
    const [jsonOutput, setJsonOutput] = useState('');
    const [unitInput, setUnitInput] = useState('');
    const [unitOutput, setUnitOutput] = useState('');
    const [base64Input, setBase64Input] = useState('');
    const [base64Output, setBase64Output] = useState('');
    const [colorInput, setColorInput] = useState('#3b82f6');
    const [regexPattern, setRegexPattern] = useState('');
    const [regexFlags, setRegexFlags] = useState('g');
    const [regexTestString, setRegexTestString] = useState('');
    const [regexMatches, setRegexMatches] = useState<string[]>([]);
    const [diffOriginal, setDiffOriginal] = useState('');
    const [diffModified, setDiffModified] = useState('');

    // --- Teacher Tools State ---
    // Whiteboard
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [brushColor, setBrushColor] = useState('#ffffff');
    const [brushSize, setBrushSize] = useState(5);

    // Timer
    const [timerSeconds, setTimerSeconds] = useState(300); // 5 min default
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [timerMode, setTimerMode] = useState<'Timer' | 'Stopwatch'>('Timer');

    // Random Picker
    const [pickerItems, setPickerItems] = useState('');
    const [pickerResult, setPickerResult] = useState<string | null>(null);
    const [isPicking, setIsPicking] = useState(false);

    // --- Student / Productivity Tools State ---
    // Notes
    const [notes, setNotes] = useState<any[]>([]);
    const [currentNote, setCurrentNote] = useState('');
    const [loadingNotes, setLoadingNotes] = useState(false);

    // Flashcards
    const [flashcards, setFlashcards] = useState<any[]>([]);
    const [currentCardIndex, setCurrentCardIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [loadingFlashcards, setLoadingFlashcards] = useState(false);

    // --- Audit Logs State ---
    const [auditLogs, setAuditLogs] = useState<AuditLogRecord[]>([]);
    const [auditLoading, setAuditLoading] = useState(false);
    const [auditExporting, setAuditExporting] = useState(false);
    const [auditPage, setAuditPage] = useState(1);
    const [auditTotalPages, setAuditTotalPages] = useState(1);
    const [auditFilters, setAuditFilters] = useState({ action: '', severity: '', from: '', to: '' });

    // Fetch Data
    useEffect(() => {
        if (activeTool === 'Notes') {
            loadNotes();
        } else if (activeTool === 'Flashcards') {
            loadFlashcards();
        }
    }, [activeTool]);

    useEffect(() => {
        if (activeTool === 'Audit Log') {
            loadAuditLogs(1);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTool]);

    const loadNotes = async () => {
        setLoadingNotes(true);
        try {
            const records = await pb.collection('notes').getFullList({ sort: '-created' });
            setNotes(records);
        } catch (e) {
            console.error('Error loading notes:', e);
        } finally {
            setLoadingNotes(false);
        }
    };

    const loadFlashcards = async () => {
        setLoadingFlashcards(true);
        try {
            const records = await pb.collection('flashcards').getFullList({ sort: '-created' });
            setFlashcards(records);
        } catch (e) {
            console.error('Error loading flashcards:', e);
        } finally {
            setLoadingFlashcards(false);
        }
    };

    // Audit logs loader
    const loadAuditLogs = async (page = 1, overrides: Partial<typeof auditFilters> = {}) => {
        if (activeTool !== 'Audit Log') return;
        const nextFilters = { ...auditFilters, ...overrides };
        setAuditFilters(nextFilters);
        setAuditLoading(true);
        try {
            const result = await auditAdminService.list({
                page,
                perPage: 25,
                action: nextFilters.action || undefined,
                severity: nextFilters.severity || undefined,
                from: nextFilters.from || undefined,
                to: nextFilters.to || undefined,
            });
            setAuditLogs(result.items || []);
            setAuditPage(result.page || 1);
            setAuditTotalPages(result.totalPages || 1);
        } catch (e) {
            console.error('Failed to load audit logs:', e);
            alert(e instanceof Error ? e.message : 'Failed to load audit logs');
        } finally {
            setAuditLoading(false);
        }
    };

    const exportAuditLogs = async () => {
        setAuditExporting(true);
        try {
            const blob = await auditAdminService.export({
                action: auditFilters.action || undefined,
                severity: auditFilters.severity || undefined,
                from: auditFilters.from || undefined,
                to: auditFilters.to || undefined,
            });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'audit-logs.csv';
            link.click();
            URL.revokeObjectURL(url);
        } catch (e) {
            console.error('Failed to export audit logs:', e);
            alert(e instanceof Error ? e.message : 'Failed to export audit logs');
        } finally {
            setAuditExporting(false);
        }
    };

    const formatJson = () => {
        try {
            const parsed = JSON.parse(jsonInput);
            setJsonOutput(JSON.stringify(parsed, null, 2));
        } catch (e) {
            setJsonOutput('Invalid JSON');
        }
    };

    const convertUnit = () => {
        // Convert meters to feet
        const val = parseFloat(unitInput);
        if (!isNaN(val)) {
            setUnitOutput(`${(val * 3.28084).toFixed(2)} ft`);
        } else {
            setUnitOutput('Invalid Input');
        }
    }

    const handleBase64Encode = () => {
        try {
            setBase64Output(btoa(base64Input));
        } catch (e) {
            setBase64Output('Error encoding');
        }
    };

    const handleBase64Decode = () => {
        try {
            setBase64Output(atob(base64Input));
        } catch (e) {
            setBase64Output('Error decoding');
        }
    };

    const handleRegexTest = () => {
        try {
            const regex = new RegExp(regexPattern, regexFlags);
            const matches = regexTestString.match(regex);
            setRegexMatches(matches ? Array.from(matches) : []);
        } catch (e) {
            setRegexMatches(['Invalid Regex']);
        }
    };

    const hexToRgb = (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? `rgb(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)})` : null;
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            await uploadFile(e.target.files[0]);
        }
    };

    const handleCreateFolder = async () => {
        if (!newFolderName || newFolderName.trim().length === 0) {
            return;
        }
        
        // Validate folder name (1-50 chars, no special chars except - and _)
        if (newFolderName.length > 50) {
            return;
        }
        
        const sanitized = newFolderName.trim().replace(/[^a-zA-Z0-9-_ ]/g, '');
        if (sanitized.length < 1) {
            return;
        }
        
        await createFolder(sanitized);
        setNewFolderName('');
        setIsCreatingFolder(false);
    };

    // --- Teacher Tools Logic ---
    // Whiteboard
    useEffect(() => {
        if (activeTool === 'Whiteboard' && canvasRef.current) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.strokeStyle = brushColor;
                ctx.lineWidth = brushSize;
            }
        }
    }, [activeTool, brushColor, brushSize]);

    const startDrawing = (e: React.MouseEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        setIsDrawing(true);
        const rect = canvas.getBoundingClientRect();
        ctx.beginPath();
        ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    };

    const draw = (e: React.MouseEvent) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
        ctx.stroke();
    };

    const stopDrawing = () => {
        setIsDrawing(false);
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    };

    // Timer
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isTimerRunning) {
            interval = setInterval(() => {
                setTimerSeconds(prev => {
                    if (timerMode === 'Timer') return prev > 0 ? prev - 1 : 0;
                    return prev + 1;
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isTimerRunning, timerMode]);

    const formatTime = (secs: number) => {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    // Random Picker
    const pickRandom = () => {
        const items = pickerItems.split('\n').filter(i => i.trim());
        if (items.length === 0) return;

        setIsPicking(true);
        let count = 0;
        const interval = setInterval(() => {
            setPickerResult(items[Math.floor(Math.random() * items.length)]);
            count++;
            if (count > 10) {
                clearInterval(interval);
                setIsPicking(false);
            }
        }, 100);
    };

    // Notes Logic
    const addNote = async () => {
        if (currentNote.trim()) {
            try {
                const record = await pb.collection('notes').create({
                    content: currentNote,
                    user: pb.authStore.model?.id
                });
                setNotes([record, ...notes]);
                setCurrentNote('');
            } catch (e) {
                console.error('Error adding note:', e);
                alert('Failed to save note');
            }
        }
    };

    const deleteNote = async (id: string) => {
        if (confirm('Delete this note?')) {
            try {
                await pb.collection('notes').delete(id);
                setNotes(notes.filter(n => n.id !== id));
            } catch (e) {
                console.error('Error deleting note:', e);
            }
        }
    };

    // Flashcards Logic
    const nextCard = () => {
        setIsFlipped(false);
        setCurrentCardIndex((prev) => (prev + 1) % flashcards.length);
    };

    const renderToolContent = () => {
        switch (activeTool) {
            case 'Tasks':
                return <TasksTool />;
            case 'Calendar':
                return <CalendarTool />;
            // --- Teacher Tools ---
            case 'Whiteboard':
                return (
                    <div className="h-full flex flex-col gap-4">
                        <div className="flex justify-between items-center bg-[#161825] p-2 rounded-lg border border-[#2a2d3d]">
                            <div className="flex gap-4 items-center">
                                <input
                                    type="color"
                                    value={brushColor}
                                    onChange={(e) => setBrushColor(e.target.value)}
                                    className="w-8 h-8 rounded cursor-pointer bg-transparent"
                                />
                                <input
                                    type="range"
                                    min="1"
                                    max="20"
                                    value={brushSize}
                                    onChange={(e) => setBrushSize(parseInt(e.target.value))}
                                    className="w-32"
                                />
                            </div>
                            <button onClick={clearCanvas} className="text-xs bg-red-500/10 text-red-400 px-3 py-1 rounded hover:bg-red-500/20">Clear Board</button>
                        </div>
                        <div className="flex-1 bg-white rounded-lg overflow-hidden cursor-crosshair relative">
                            <canvas
                                ref={canvasRef}
                                width={800}
                                height={600}
                                className="w-full h-full touch-none"
                                onMouseDown={startDrawing}
                                onMouseMove={draw}
                                onMouseUp={stopDrawing}
                                onMouseLeave={stopDrawing}
                            />
                        </div>
                    </div>
                );
            case 'Timer':
                return (
                    <div className="h-full flex flex-col items-center justify-center gap-8">
                        <div className="flex gap-4 bg-[#161825] p-1 rounded-lg border border-[#2a2d3d]">
                            <button
                                onClick={() => { setTimerMode('Timer'); setIsTimerRunning(false); }}
                                className={`px-4 py-2 rounded text-sm ${timerMode === 'Timer' ? 'bg-[#2a2d3d] text-white' : 'text-gray-500'}`}
                            >Timer</button>
                            <button
                                onClick={() => { setTimerMode('Stopwatch'); setIsTimerRunning(false); setTimerSeconds(0); }}
                                className={`px-4 py-2 rounded text-sm ${timerMode === 'Stopwatch' ? 'bg-[#2a2d3d] text-white' : 'text-gray-500'}`}
                            >Stopwatch</button>
                        </div>

                        <div className="text-9xl font-mono font-bold text-white tabular-nums tracking-wider">
                            {formatTime(timerSeconds)}
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={() => setIsTimerRunning(!isTimerRunning)}
                                className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${isTimerRunning ? 'bg-red-500 hover:bg-red-600' : 'bg-emerald-500 hover:bg-emerald-600'}`}
                            >
                                <Icon name={isTimerRunning ? "PauseIcon" : "PlayIcon"} className="w-8 h-8 text-white" />
                            </button>
                            <button
                                onClick={() => { setIsTimerRunning(false); setTimerSeconds(timerMode === 'Timer' ? 300 : 0); }}
                                className="w-16 h-16 rounded-full bg-[#2a2d3d] hover:bg-[#3f4255] flex items-center justify-center transition-all"
                            >
                                <Icon name="ArrowPathIcon" className="w-6 h-6 text-gray-300" />
                            </button>
                        </div>

                        {timerMode === 'Timer' && (
                            <div className="flex gap-2 mt-8">
                                {[1, 5, 10, 25].map(min => (
                                    <button
                                        key={min}
                                        onClick={() => { setTimerSeconds(min * 60); setIsTimerRunning(false); }}
                                        className="px-4 py-2 bg-[#161825] border border-[#2a2d3d] rounded text-xs text-gray-400 hover:text-white hover:border-gray-500"
                                    >
                                        {min}m
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                );
            case 'Random Picker':
                return (
                    <div className="h-full flex gap-6 p-4">
                        <div className="w-1/3 flex flex-col gap-2">
                            <label className="text-sm text-gray-400">Items (one per line)</label>
                            <textarea
                                value={pickerItems}
                                onChange={(e) => setPickerItems(e.target.value)}
                                className="flex-1 bg-[#161825] border border-[#2a2d3d] rounded-lg p-4 text-sm text-white resize-none focus:outline-none focus:border-emerald-500"
                                placeholder="Alice&#10;Bob&#10;Charlie"
                            />
                        </div>
                        <div className="flex-1 flex flex-col items-center justify-center gap-8 bg-[#161825] rounded-lg border border-[#2a2d3d]">
                            {pickerResult ? (
                                <div className={`text-5xl font-bold text-center transition-all ${isPicking ? 'scale-90 opacity-50' : 'scale-100 opacity-100 text-emerald-400'}`}>
                                    {pickerResult}
                                </div>
                            ) : (
                                <div className="text-gray-600 text-xl">Enter items and click Pick</div>
                            )}
                            <button
                                onClick={pickRandom}
                                disabled={isPicking || !pickerItems.trim()}
                                className="px-8 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-bold text-lg shadow-lg shadow-blue-900/20"
                            >
                                {isPicking ? 'Picking...' : 'Pick Random'}
                            </button>
                        </div>
                    </div>
                );

            // --- Student / Productivity Tools ---
            case 'Notes':
                return (
                    <div className="h-full flex gap-4">
                        <div className="w-1/3 bg-[#161825] border border-[#2a2d3d] rounded-lg p-2 overflow-y-auto">
                            {loadingNotes ? (
                                <div className="text-center text-gray-500 py-4">Loading...</div>
                            ) : notes.length === 0 ? (
                                <div className="text-center text-gray-500 py-4 text-xs">No notes yet</div>
                            ) : (
                                notes.map((note) => (
                                    <div key={note.id} className="group relative p-3 mb-2 bg-[#0f111a] rounded border border-[#2a2d3d] text-xs text-gray-300 hover:border-emerald-500/50 transition-colors">
                                        <div className="truncate pr-6">{note.content}</div>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); deleteNote(note.id); }}
                                            className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-opacity"
                                        >
                                            <Icon name="TrashIcon" className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                        <div className="flex-1 flex flex-col gap-2">
                            <textarea
                                value={currentNote}
                                onChange={(e) => setCurrentNote(e.target.value)}
                                className="flex-1 bg-[#161825] border border-[#2a2d3d] rounded-lg p-4 text-sm text-white resize-none focus:outline-none focus:border-emerald-500"
                                placeholder="Type your note here..."
                            />
                            <button onClick={addNote} disabled={!currentNote.trim()} className="bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2 rounded text-sm font-bold hover:bg-emerald-500 transition-colors">Save Note</button>
                        </div>
                    </div>
                );
            case 'Audit Log': {
                const severityVariant = (sev?: string): 'danger' | 'warning' | 'info' | 'neutral' => {
                    const s = (sev || '').toLowerCase();
                    if (s === 'critical' || s === 'error') return 'danger';
                    if (s === 'warning' || s === 'warn') return 'warning';
                    if (s === 'info') return 'info';
                    return 'neutral';
                };

                return (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                            <Input
                                label="Action contains"
                                placeholder="payment, export, attendance..."
                                value={auditFilters.action}
                                onChange={(e) => setAuditFilters({ ...auditFilters, action: e.target.value })}
                            />
                            <Select
                                label="Severity"
                                value={auditFilters.severity}
                                onChange={(e) => setAuditFilters({ ...auditFilters, severity: e.target.value })}
                            >
                                <option value="">All</option>
                                <option value="info">Info</option>
                                <option value="warning">Warning</option>
                                <option value="error">Error</option>
                                <option value="critical">Critical</option>
                            </Select>
                            <Input
                                label="From"
                                type="date"
                                value={auditFilters.from}
                                onChange={(e) => setAuditFilters({ ...auditFilters, from: e.target.value })}
                            />
                            <Input
                                label="To"
                                type="date"
                                value={auditFilters.to}
                                onChange={(e) => setAuditFilters({ ...auditFilters, to: e.target.value })}
                            />
                            <div className="flex items-end gap-2">
                                <Button variant="primary" onClick={() => loadAuditLogs(1)} isLoading={auditLoading} className="w-full">Apply</Button>
                                <Button variant="secondary" onClick={exportAuditLogs} isLoading={auditExporting} className="w-full">Export CSV</Button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>Page {auditPage} of {auditTotalPages}</span>
                            <div className="flex gap-2">
                                <Button size="sm" variant="ghost" disabled={auditPage <= 1 || auditLoading} onClick={() => loadAuditLogs(auditPage - 1)}>Prev</Button>
                                <Button size="sm" variant="ghost" disabled={auditPage >= auditTotalPages || auditLoading} onClick={() => loadAuditLogs(auditPage + 1)}>Next</Button>
                            </div>
                        </div>

                        <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
                            <Table>
                                <Thead>
                                    <Tr>
                                        <Th>Timestamp</Th>
                                        <Th>Action</Th>
                                        <Th>Resource</Th>
                                        <Th>User</Th>
                                        <Th>Severity</Th>
                                        <Th>Metadata</Th>
                                    </Tr>
                                </Thead>
                                <tbody>
                                    {auditLoading ? (
                                        <Tr><Td colSpan={6} className="text-center text-gray-500 py-6">Loading audit logs...</Td></Tr>
                                    ) : auditLogs.length === 0 ? (
                                        <Tr><Td colSpan={6} className="text-center text-gray-500 py-6">No audit entries found for this tenant</Td></Tr>
                                    ) : (
                                        auditLogs.map((log) => (
                                            <Tr key={log.id || `${log.timestamp}-${log.action}`}>
                                                <Td className="text-sm text-gray-600 whitespace-nowrap">{log.timestamp ? new Date(log.timestamp).toLocaleString() : '-'}</Td>
                                                <Td className="font-semibold text-gray-900">{log.action}</Td>
                                                <Td className="text-gray-600 text-sm">{log.resource_type || '-'} {log.resource_id ? `(${log.resource_id})` : ''}</Td>
                                                <Td className="text-sm text-gray-700">{log.user_id || 'system'}</Td>
                                                <Td><Badge variant={severityVariant(log.severity)} size="sm">{log.severity || 'info'}</Badge></Td>
                                                <Td className="text-xs text-gray-500 max-w-[260px] truncate" title={log.metadata ? JSON.stringify(log.metadata) : ''}>
                                                    {log.metadata ? JSON.stringify(log.metadata) : '-'}
                                                </Td>
                                            </Tr>
                                        ))
                                    )}
                                </tbody>
                            </Table>
                        </div>
                    </div>
                );
            }
            case 'Flashcards':
                const card = flashcards[currentCardIndex];
                return (
                    <div className="h-full flex flex-col items-center justify-center gap-8">
                        {loadingFlashcards ? (
                            <div className="text-gray-500">Loading flashcards...</div>
                        ) : flashcards.length === 0 ? (
                            <div className="text-center text-gray-500">
                                <p>No flashcards found.</p>
                                <p className="text-xs mt-2">Add some via the database or ask admin to seed them.</p>
                            </div>
                        ) : (
                            <>
                                <div
                                    onClick={() => setIsFlipped(!isFlipped)}
                                    className={`w-96 h-64 bg-[#161825] border border-[#2a2d3d] rounded-xl flex items-center justify-center p-8 cursor-pointer transition-all transform duration-500 ${isFlipped ? 'rotate-y-180' : ''}`}
                                >
                                    <div className="text-2xl font-bold text-center text-white">
                                        {isFlipped ? card.back : card.front}
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <button onClick={() => setIsFlipped(!isFlipped)} className="px-6 py-2 bg-[#2a2d3d] text-white rounded-lg hover:bg-[#3f4255] transition-colors">Flip</button>
                                    <button onClick={nextCard} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors">Next Card</button>
                                </div>
                                <div className="text-xs text-gray-500 font-mono">
                                    Card {currentCardIndex + 1} of {flashcards.length}
                                </div>
                            </>
                        )}
                    </div>
                );


            // --- Dev Tools ---
            case 'File Manager':
                return (
                    <div className="h-full flex flex-col gap-4">
                        <div className="flex justify-between items-center bg-[#161825] p-4 rounded-lg border border-[#2a2d3d]">
                            <div className="flex items-center gap-2">
                                <h3 className="text-gray-200 font-bold text-sm">Project Files</h3>
                                {filesLoading && <span className="text-xs text-gray-500 animate-pulse">Syncing...</span>}
                            </div>
                            <div className="flex gap-2">
                                <div className="relative">
                                    <input
                                        type="file"
                                        id="file-upload"
                                        className="hidden"
                                        onChange={handleFileUpload}
                                    />
                                    <label
                                        htmlFor="file-upload"
                                        className="cursor-pointer bg-[#2a2d3d] hover:bg-[#3f4255] text-white px-3 py-1.5 rounded text-xs flex items-center gap-2 transition-colors"
                                    >
                                        <Icon name="ArrowUpTrayIcon" className="w-3 h-3" />
                                        Upload
                                    </label>
                                </div>
                                <button
                                    onClick={() => setIsCreatingFolder(!isCreatingFolder)}
                                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded text-xs flex items-center gap-2 transition-colors"
                                >
                                    <Icon name="FolderPlusIcon" className="w-3 h-3" />
                                    New Folder
                                </button>
                            </div>
                        </div>

                        {fileError && (
                            <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-2 rounded text-xs flex items-center gap-2 animate-fadeIn">
                                <Icon name="ExclamationTriangleIcon" className="w-4 h-4" />
                                {fileError}
                            </div>
                        )}

                        {isCreatingFolder && (
                            <div className="flex gap-2 items-center p-2 bg-[#161825] rounded border border-[#2a2d3d] animate-fadeIn">
                                <Icon name="FolderIcon" className="w-4 h-4 text-yellow-500" />
                                <input
                                    type="text"
                                    value={newFolderName}
                                    onChange={(e) => setNewFolderName(e.target.value)}
                                    placeholder="Folder Name"
                                    className="bg-transparent border-b border-gray-600 text-xs text-white focus:outline-none focus:border-emerald-500 px-1"
                                    autoFocus
                                    onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
                                />
                                <button onClick={handleCreateFolder} className="text-emerald-500 hover:text-emerald-400"><Icon name="CheckIcon" className="w-4 h-4" /></button>
                                <button onClick={() => setIsCreatingFolder(false)} className="text-red-500 hover:text-red-400"><Icon name="XMarkIcon" className="w-4 h-4" /></button>
                            </div>
                        )}

                        <div className="flex-1 bg-[#0d1117] border border-gray-800 rounded-lg overflow-hidden">
                            {files.length === 0 && !filesLoading ? (
                                <div className="h-full flex flex-col items-center justify-center text-gray-500 gap-2">
                                    <Icon name="FolderOpenIcon" className="w-8 h-8 opacity-50" />
                                    <span className="text-xs">No files found</span>
                                </div>
                            ) : (
                                <FileTree data={files} onDelete={deleteItem} />
                            )}
                        </div>
                    </div>
                );
            case 'JSON Formatter':
                return (
                    <div className="h-full flex flex-col gap-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-gray-400 font-mono text-sm">Input JSON</h3>
                            <button onClick={formatJson} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-1 rounded text-xs font-mono transition-colors">Format</button>
                        </div>
                        <div className="flex-1 grid grid-cols-2 gap-4 min-h-0">
                            <textarea
                                value={jsonInput}
                                onChange={(e) => setJsonInput(e.target.value)}
                                className="bg-[#0d1117] border border-gray-800 rounded-lg p-4 font-mono text-xs text-gray-300 resize-none focus:outline-none focus:border-gray-600"
                                placeholder='{"key": "value"}'
                            />
                            <div className="bg-[#0d1117] border border-gray-800 rounded-lg p-4 font-mono text-xs text-emerald-400 overflow-auto whitespace-pre">
                                {jsonOutput || '// Formatted output will appear here'}
                            </div>
                        </div>
                    </div>
                );
            case 'Unit Converter':
                return (
                    <div className="h-full flex flex-col items-center justify-center gap-8 max-w-md mx-auto">
                        <div className="w-full bg-[#0d1117] border border-gray-800 rounded-xl p-6">
                            <label className="block text-gray-400 text-xs font-mono mb-2">Meters</label>
                            <input
                                type="number"
                                value={unitInput}
                                onChange={(e) => setUnitInput(e.target.value)}
                                className="w-full bg-black border border-gray-700 rounded px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
                            />
                        </div>
                        <div className="text-gray-500">
                            <Icon name="ArrowDownIcon" className="w-6 h-6" />
                        </div>
                        <div className="w-full bg-[#0d1117] border border-gray-800 rounded-xl p-6">
                            <label className="block text-gray-400 text-xs font-mono mb-2">Feet</label>
                            <div className="text-2xl font-mono text-emerald-400 font-bold">
                                {unitOutput || '0.00 ft'}
                            </div>
                        </div>
                        <button onClick={convertUnit} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-lg font-mono font-bold transition-colors">Convert</button>
                    </div>
                );
            case 'Base64 Encoder':
                return (
                    <div className="h-full flex flex-col gap-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-gray-400 font-mono text-sm">Input Text</h3>
                            <div className="flex gap-2">
                                <button onClick={handleBase64Encode} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-1 rounded text-xs font-mono transition-colors">Encode</button>
                                <button onClick={handleBase64Decode} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-1 rounded text-xs font-mono transition-colors">Decode</button>
                            </div>
                        </div>
                        <div className="flex-1 grid grid-cols-2 gap-4 min-h-0">
                            <textarea
                                value={base64Input}
                                onChange={(e) => setBase64Input(e.target.value)}
                                className="bg-[#0d1117] border border-gray-800 rounded-lg p-4 font-mono text-xs text-gray-300 resize-none focus:outline-none focus:border-gray-600"
                                placeholder='Enter text to encode/decode...'
                            />
                            <div className="bg-[#0d1117] border border-gray-800 rounded-lg p-4 font-mono text-xs text-emerald-400 overflow-auto whitespace-pre break-all">
                                {base64Output || '// Output will appear here'}
                            </div>
                        </div>
                    </div>
                );
            case 'Color Picker':
                return (
                    <div className="h-full flex flex-col items-center justify-center gap-8">
                        <div className="flex flex-col items-center gap-4">
                            <input
                                type="color"
                                value={colorInput}
                                onChange={(e) => setColorInput(e.target.value)}
                                className="w-32 h-32 rounded-full overflow-hidden cursor-pointer border-4 border-[#2a2d3d] shadow-2xl"
                            />
                            <span className="text-gray-400 font-mono text-sm">Click circle to pick</span>
                        </div>

                        <div className="grid grid-cols-1 gap-4 w-full max-w-md">
                            <div className="bg-[#0d1117] border border-gray-800 rounded-lg p-4 flex justify-between items-center">
                                <span className="text-gray-500 text-xs font-mono">HEX</span>
                                <span className="text-emerald-400 font-mono font-bold select-all">{colorInput}</span>
                            </div>
                            <div className="bg-[#0d1117] border border-gray-800 rounded-lg p-4 flex justify-between items-center">
                                <span className="text-gray-500 text-xs font-mono">RGB</span>
                                <span className="text-blue-400 font-mono font-bold select-all">{hexToRgb(colorInput)}</span>
                            </div>
                        </div>
                    </div>
                );
            case 'Regex Tester':
                return (
                    <div className="h-full flex flex-col gap-4">
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <label className="text-xs text-gray-500 font-mono mb-1 block">Pattern</label>
                                <input
                                    type="text"
                                    value={regexPattern}
                                    onChange={(e) => setRegexPattern(e.target.value)}
                                    className="w-full bg-[#0d1117] border border-gray-800 rounded p-2 text-emerald-400 font-mono text-sm focus:outline-none focus:border-emerald-500"
                                    placeholder="[a-z]+"
                                />
                            </div>
                            <div className="w-24">
                                <label className="text-xs text-gray-500 font-mono mb-1 block">Flags</label>
                                <input
                                    type="text"
                                    value={regexFlags}
                                    onChange={(e) => setRegexFlags(e.target.value)}
                                    className="w-full bg-[#0d1117] border border-gray-800 rounded p-2 text-gray-300 font-mono text-sm focus:outline-none focus:border-emerald-500"
                                    placeholder="g"
                                />
                            </div>
                            <div className="flex items-end">
                                <button onClick={handleRegexTest} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded text-xs font-mono transition-colors h-[38px]">Test</button>
                            </div>
                        </div>

                        <div className="flex-1 grid grid-cols-2 gap-4 min-h-0">
                            <div className="flex flex-col gap-2">
                                <label className="text-xs text-gray-500 font-mono">Test String</label>
                                <textarea
                                    value={regexTestString}
                                    onChange={(e) => setRegexTestString(e.target.value)}
                                    className="flex-1 bg-[#0d1117] border border-gray-800 rounded-lg p-4 font-mono text-xs text-gray-300 resize-none focus:outline-none focus:border-gray-600"
                                    placeholder="Enter text to test against..."
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-xs text-gray-500 font-mono">Matches ({regexMatches.length})</label>
                                <div className="flex-1 bg-[#0d1117] border border-gray-800 rounded-lg p-4 font-mono text-xs text-emerald-400 overflow-auto">
                                    {regexMatches.length > 0 ? (
                                        <ul className="list-disc list-inside space-y-1">
                                            {regexMatches.map((m, i) => <li key={i}>{m}</li>)}
                                        </ul>
                                    ) : (
                                        <span className="text-gray-600">// No matches found</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'Diff Checker':
                return (
                    <div className="h-full flex flex-col gap-4">
                        <div className="flex-1 grid grid-cols-2 gap-4 min-h-0">
                            <div className="flex flex-col gap-2">
                                <label className="text-xs text-gray-500 font-mono">Original</label>
                                <textarea
                                    value={diffOriginal}
                                    onChange={(e) => setDiffOriginal(e.target.value)}
                                    className="flex-1 bg-[#0d1117] border border-gray-800 rounded-lg p-4 font-mono text-xs text-gray-300 resize-none focus:outline-none focus:border-red-900/30"
                                    placeholder="Original text..."
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-xs text-gray-500 font-mono">Modified</label>
                                <textarea
                                    value={diffModified}
                                    onChange={(e) => setDiffModified(e.target.value)}
                                    className="flex-1 bg-[#0d1117] border border-gray-800 rounded-lg p-4 font-mono text-xs text-gray-300 resize-none focus:outline-none focus:border-green-900/30"
                                    placeholder="Modified text..."
                                />
                            </div>
                        </div>
                        <div className="h-12 bg-[#161825] border border-[#2a2d3d] rounded-lg flex items-center justify-center text-xs text-gray-500 font-mono">
                            Simple visual comparison (Advanced diffing requires library)
                        </div>
                    </div>
                );
            case 'Reports':
                return <ReportsApp />;
            default:
                return <div className="flex items-center justify-center h-full text-gray-500 font-mono">Select a tool from the sidebar</div>;
        }
    };

    if (activeTab === 'Resources') {
        return <ResourcesView activeSubNav={activeSubNav} />;
    }

    // Determine which tools to show in sidebar
    const getSidebarTools = () => {
        if (activeTab === 'Classroom') return ['Whiteboard', 'Timer', 'Random Picker', 'Reports'];
        if (activeTab === 'Productivity') return ['Notes', 'Calendar', 'Tasks'];

        // Student Tabs
        if (activeTab === 'Notes') return ['Notes'];
        if (activeTab === 'Flashcards') return ['Flashcards'];
        if (activeTab === 'Timer') return ['Timer'];

        return ['File Manager', 'JSON Formatter', 'Unit Converter', 'Base64 Encoder', 'Regex Tester', 'Color Picker', 'Diff Checker'];
    };

    return (
        <div className="h-full flex flex-col bg-[#0f111a] text-gray-300 rounded-xl overflow-hidden shadow-2xl animate-fadeIn border border-[#2a2d3d]">
            {/* Header */}
            <div className="h-16 bg-[#1a1d2d] border-b border-[#2a2d3d] flex items-center justify-between px-6 shrink-0">
                <div>
                    <h1 className="text-lg font-bold text-white tracking-wide font-mono flex items-center gap-2">
                        <Icon name="CommandLineIcon" className="w-5 h-5 text-emerald-500" />
                        {activeTab === 'Classroom' ? 'CLASSROOM_TOOLS' : 'DEV_TOOLS_CONSOLE'}
                    </h1>
                </div>
                <div className="flex items-center gap-3 text-xs font-mono">
                    <span className="flex items-center gap-1.5 text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        CONNECTED
                    </span>
                    <span className="text-gray-500">v2.4.0-stable</span>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar Tool List */}
                <div className="w-64 bg-[#161825] border-r border-[#2a2d3d] flex flex-col">
                    <div className="p-4 border-b border-[#2a2d3d]">
                        <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest font-mono mb-1">{activeTab}</h3>
                        <input type="text" placeholder="Filter..." className="w-full bg-[#0f111a] border border-[#2a2d3d] rounded p-2 text-xs text-gray-300 focus:outline-none focus:border-emerald-500/50 transition-colors" />
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
                        {getSidebarTools().map(tool => (
                            <button
                                key={tool}
                                onClick={() => setActiveTool(tool)}
                                className={`w-full text-left px-3 py-2.5 rounded text-xs font-mono flex items-center gap-3 transition-all ${activeTool === tool ? 'bg-[#2a2d3d] text-white border-l-2 border-emerald-500' : 'text-gray-500 hover:bg-[#1f2233] hover:text-gray-300'}`}
                            >
                                <Icon name="WrenchScrewdriverIcon" className="w-3 h-3 opacity-70" />
                                {tool}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tool Workspace */}
                <div className="flex-1 flex flex-col min-w-0 bg-[#0f111a]">
                    {/* Toolbar */}
                    <div className="h-12 border-b border-[#2a2d3d] flex items-center justify-between px-4 bg-[#161825]">
                        <div className="flex items-center gap-4">
                            <h2 className="text-sm font-bold text-white font-mono">{activeTool}</h2>
                            <div className="h-4 w-[1px] bg-[#2a2d3d]"></div>
                            <div className="flex gap-1">
                                <button className="p-1.5 text-gray-500 hover:text-white rounded hover:bg-[#2a2d3d] transition-colors"><Icon name="ArrowPathIcon" className="w-4 h-4" /></button>
                                <button className="p-1.5 text-gray-500 hover:text-white rounded hover:bg-[#2a2d3d] transition-colors"><Icon name="TrashIcon" className="w-4 h-4" /></button>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button className="px-3 py-1.5 text-xs font-mono border border-[#2a2d3d] rounded hover:bg-[#2a2d3d] text-gray-400">Clear</button>
                        </div>
                    </div>

                    {/* Editor / Output Area */}
                    <div className="flex-1 p-6 overflow-auto">
                        {renderToolContent()}
                    </div>

                    {/* Status Bar */}
                    <div className="h-6 bg-[#1a1d2d] border-t border-[#2a2d3d] flex items-center justify-between px-4 text-[10px] text-gray-500 font-mono">
                        <span>Ln 12, Col 34</span>
                        <span>UTF-8</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Tools;
