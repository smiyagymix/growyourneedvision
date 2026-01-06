import React, { useState, useEffect } from 'react';
import { Card, Button, Icon, Badge, Modal } from '../../components/shared/ui/CommonUI';
import { Input } from '../../components/shared/ui/Input';
import { Select } from '../../components/shared/ui/Select';
import { 
    aiTrainingService, 
    TrainingJob, 
    Dataset, 
    PromptTemplate, 
    KnowledgeDocument, 
    Workflow 
} from '../../services/aiTrainingService';

export const AIDevelopment: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'overview' | 'prompts' | 'knowledge' | 'workflows'>('overview');
    
    // Overview State
    const [model, setModel] = useState('qwen2.5:1.5b');
    const [temperature, setTemperature] = useState(0.7);
    const [maxTokens, setMaxTokens] = useState(4096);
    const [jobs, setJobs] = useState<TrainingJob[]>([]);
    const [datasets, setDatasets] = useState<Dataset[]>([]);
    const [isJobModalOpen, setIsJobModalOpen] = useState(false);
    const [newJob, setNewJob] = useState({
        model_name: '',
        base_model: 'llama-3-8b',
        dataset_url: '',
        epochs: 3
    });

    // Prompts State
    const [prompts, setPrompts] = useState<PromptTemplate[]>([]);
    const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
    const [editingPrompt, setEditingPrompt] = useState<Partial<PromptTemplate>>({});

    // Knowledge State
    const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

    // Workflows State
    const [workflows, setWorkflows] = useState<Workflow[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            const [jobsData, datasetsData, promptsData, docsData, workflowsData] = await Promise.all([
                aiTrainingService.getJobs(),
                aiTrainingService.getDatasets(),
                aiTrainingService.getPrompts(),
                aiTrainingService.getDocuments(),
                aiTrainingService.getWorkflows()
            ]);
            setJobs(jobsData);
            setDatasets(datasetsData);
            setPrompts(promptsData);
            setDocuments(docsData);
            setWorkflows(workflowsData);
        };
        fetchData();
    }, []);

    const handleCreateJob = async () => {
        if (!newJob.model_name || !newJob.dataset_url) return;
        const job = await aiTrainingService.createJob({
            ...newJob,
            status: 'Queued',
            progress: 0,
            started_at: new Date().toISOString()
        });
        setJobs([job, ...jobs]);
        setIsJobModalOpen(false);
    };

    const handleSavePrompt = async () => {
        if (!editingPrompt.name || !editingPrompt.content) return;
        
        if (editingPrompt.id) {
            // Update
            const updated = await aiTrainingService.updatePrompt(editingPrompt.id, editingPrompt);
            setPrompts(prompts.map(p => p.id === updated.id ? updated : p));
        } else {
            // Create
            const created = await aiTrainingService.createPrompt(editingPrompt);
            setPrompts([created, ...prompts]);
        }
        setIsPromptModalOpen(false);
        setEditingPrompt({});
    };

    const handleUploadDocument = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const doc = await aiTrainingService.uploadDocument(file);
            setDocuments([doc, ...documents]);
            setIsUploadModalOpen(false);
        }
    };

    const handleSyncKnowledge = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_AI_SERVICE_URL}/refresh-knowledge`, {
                method: 'POST'
            });
            if (response.ok) {
                // Ideally show a toast notification
                console.log('Knowledge Base sync started!');
            } else {
                console.error('Failed to start sync.');
            }
        } catch (e) {
            console.error('Error connecting to AI Service:', e);
        }
    };

    const renderTabs = () => (
        <div className="flex space-x-4 border-b border-gray-200 dark:border-gray-700 mb-6">
            {[
                { id: 'overview', label: 'Overview & Training', icon: 'ChartBarIcon' },
                { id: 'prompts', label: 'Prompt Engineering', icon: 'ChatBubbleLeftRightIcon' },
                { id: 'knowledge', label: 'Knowledge Base', icon: 'BookOpenIcon' },
                { id: 'workflows', label: 'Workflows', icon: 'ArrowsRightLeftIcon' }
            ].map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === tab.id
                            ? 'border-[#002366] text-[#002366] dark:border-blue-400 dark:text-blue-400'
                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
                    }`}
                >
                    <Icon name={tab.icon as any} className="w-4 h-4" />
                    {tab.label}
                </button>
            ))}
        </div>
    );

    const renderOverview = () => (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
            {/* Model Configuration */}
            <Card className="p-6">
                <h3 className="font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                    <Icon name="AdjustmentsHorizontalIcon" className="w-5 h-5 text-purple-500" />
                    Model Parameters
                </h3>
                
                <div className="space-y-6">
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Active Model</label>
                        <select 
                            value={model}
                            onChange={(e) => setModel(e.target.value)}
                            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-sm"
                        >
                            <option value="qwen2.5:1.5b">Open WebUI (Qwen 2.5 1.5B)</option>
                            <option value="llama3">Open WebUI (Llama 3)</option>
                            <option value="gpt-4-turbo">OpenAI (GPT-4 Turbo)</option>
                            <option value="local">Local Intelligence (Fallback)</option>
                        </select>
                        <p className="text-[10px] text-gray-400 mt-1">
                            {model.includes('qwen') || model.includes('llama') 
                                ? 'Running via Docker Container (Port 3000)' 
                                : 'External API or Local Logic'}
                        </p>
                    </div>

                    <div>
                        <div className="flex justify-between mb-2">
                            <label className="text-xs font-bold text-gray-500 uppercase">Temperature</label>
                            <span className="text-xs font-mono text-gray-400">{temperature}</span>
                        </div>
                        <input 
                            type="range" 
                            min="0" 
                            max="1" 
                            step="0.1" 
                            value={temperature}
                            onChange={(e) => setTemperature(parseFloat(e.target.value))}
                            className="w-full accent-purple-500" 
                        />
                    </div>

                    <div>
                        <div className="flex justify-between mb-2">
                            <label className="text-xs font-bold text-gray-500 uppercase">Max Tokens</label>
                            <span className="text-xs font-mono text-gray-400">{maxTokens}</span>
                        </div>
                        <input 
                            type="range" 
                            min="256" 
                            max="8192" 
                            step="256" 
                            value={maxTokens}
                            onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                            className="w-full accent-purple-500" 
                        />
                    </div>
                </div>
            </Card>

            {/* Training Jobs */}
            <div className="lg:col-span-2 space-y-6">
                <div className="flex justify-between items-center">
                    <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <Icon name="CpuChipIcon" className="w-5 h-5 text-blue-500" />
                        Fine-Tuning Jobs
                    </h3>
                    <Button 
                        variant="primary" 
                        size="sm" 
                        onClick={() => setIsJobModalOpen(true)}
                        className="bg-[#002366] hover:bg-[#001a4d] text-white"
                    >
                        <Icon name="PlusIcon" className="w-4 h-4 mr-2" />
                        New Training Job
                    </Button>
                </div>

                <div className="grid gap-4">
                    {jobs.map(job => (
                        <Card key={job.id} className="p-4 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="font-bold text-gray-800 dark:text-white">{job.model_name}</h4>
                                        <Badge variant={job.status === 'Completed' ? 'success' : job.status === 'Training' ? 'warning' : 'danger'}>
                                            {job.status}
                                        </Badge>
                                    </div>
                                    <p className="text-sm text-gray-500">Base: {job.base_model} • Dataset: {job.dataset_url}</p>
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-bold text-gray-800 dark:text-white">{job.progress}%</div>
                                    <p className="text-xs text-gray-400">Epochs: {job.epochs}</p>
                                </div>
                            </div>
                            {job.status === 'Training' && (
                                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-3 dark:bg-gray-700">
                                    <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${job.progress}%` }}></div>
                                </div>
                            )}
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderPrompts = () => (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="font-bold text-gray-800 dark:text-white">System Prompts</h3>
                <Button 
                    variant="primary" 
                    size="sm" 
                    onClick={() => { setEditingPrompt({}); setIsPromptModalOpen(true); }}
                    className="bg-[#002366] hover:bg-[#001a4d] text-white"
                >
                    <Icon name="PlusIcon" className="w-4 h-4 mr-2" />
                    Create Prompt
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {prompts.map(prompt => (
                    <Card key={prompt.id} className="p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => { setEditingPrompt(prompt); setIsPromptModalOpen(true); }}>
                        <div className="flex justify-between items-start mb-2">
                            <h4 className="font-bold text-gray-800 dark:text-white">{prompt.name}</h4>
                            <Badge variant="info">{prompt.category}</Badge>
                        </div>
                        <p className="text-sm text-gray-500 mb-3 line-clamp-2">{prompt.description}</p>
                        <div className="bg-gray-50 dark:bg-gray-900 p-2 rounded text-xs font-mono text-gray-600 dark:text-gray-400 line-clamp-3">
                            {prompt.content}
                        </div>
                        <div className="mt-3 flex gap-2">
                            {prompt.variables.map(v => (
                                <span key={v} className="text-[10px] bg-purple-100 text-purple-700 px-2 py-1 rounded-full dark:bg-purple-900 dark:text-purple-300">
                                    {`{{${v}}}`}
                                </span>
                            ))}
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );

    const renderKnowledge = () => (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="font-bold text-gray-800 dark:text-white">Knowledge Base (RAG)</h3>
                <div className="flex gap-2">
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleSyncKnowledge}
                        className="text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600"
                    >
                        <Icon name="ArrowPathIcon" className="w-4 h-4 mr-2" />
                        Sync Index
                    </Button>
                    <div className="relative">
                        <input
                            type="file"
                            id="doc-upload"
                            className="hidden"
                            onChange={handleUploadDocument}
                        />
                        <label
                            htmlFor="doc-upload"
                            className="cursor-pointer bg-[#002366] hover:bg-[#001a4d] text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
                        >
                            <Icon name="ArrowUpTrayIcon" className="w-4 h-4" />
                            Upload Document
                        </label>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 dark:bg-gray-900 text-gray-500 font-medium border-b border-gray-200 dark:border-gray-700">
                        <tr>
                            <th className="px-6 py-3">Document Name</th>
                            <th className="px-6 py-3">Type</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3">Size</th>
                            <th className="px-6 py-3">Uploaded</th>
                            <th className="px-6 py-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {documents.map(doc => (
                            <tr key={doc.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white flex items-center gap-2">
                                    <Icon name="DocumentTextIcon" className="w-4 h-4 text-gray-400" />
                                    {doc.name}
                                </td>
                                <td className="px-6 py-4 text-gray-500">{doc.type}</td>
                                <td className="px-6 py-4">
                                    <Badge variant={doc.status === 'Indexed' ? 'success' : doc.status === 'Indexing' ? 'warning' : 'neutral'}>
                                        {doc.status}
                                    </Badge>
                                </td>
                                <td className="px-6 py-4 text-gray-500">{(doc.size_bytes / 1024).toFixed(1)} KB</td>
                                <td className="px-6 py-4 text-gray-500">{new Date(doc.created).toLocaleDateString()}</td>
                                <td className="px-6 py-4">
                                    <button className="text-red-500 hover:text-red-700">
                                        <Icon name="TrashIcon" className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderWorkflows = () => (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="font-bold text-gray-800 dark:text-white">AI Workflows</h3>
                <Button 
                    variant="primary" 
                    size="sm" 
                    className="bg-[#002366] hover:bg-[#001a4d] text-white"
                >
                    <Icon name="PlusIcon" className="w-4 h-4 mr-2" />
                    New Workflow
                </Button>
            </div>

            <div className="grid gap-4">
                {workflows.map(wf => (
                    <Card key={wf.id} className="p-4">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h4 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                    {wf.name}
                                    <Badge variant={wf.is_active ? 'success' : 'neutral'}>{wf.is_active ? 'Active' : 'Inactive'}</Badge>
                                </h4>
                                <p className="text-sm text-gray-500">{wf.description}</p>
                            </div>
                            <Badge variant="info" className="flex items-center gap-1">
                                <Icon name="BoltIcon" className="w-3 h-3" />
                                {wf.trigger}
                            </Badge>
                        </div>

                        <div className="flex items-center gap-2 overflow-x-auto pb-2">
                            {wf.steps.map((step, idx) => (
                                <React.Fragment key={step.id}>
                                    <div className="flex-shrink-0 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3 min-w-[120px]">
                                        <div className="text-xs font-bold text-gray-500 uppercase mb-1">Step {idx + 1}</div>
                                        <div className="font-medium text-sm text-gray-800 dark:text-white flex items-center gap-2">
                                            <Icon 
                                                name={step.type === 'LLM' ? 'SparklesIcon' : step.type === 'Tool' ? 'WrenchScrewdriverIcon' : 'ArrowPathIcon'} 
                                                className="w-4 h-4 text-blue-500" 
                                            />
                                            {step.type}
                                        </div>
                                    </div>
                                    {idx < wf.steps.length - 1 && (
                                        <Icon name="ArrowRightIcon" className="w-4 h-4 text-gray-300 flex-shrink-0" />
                                    )}
                                </React.Fragment>
                            ))}
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );

    return (
        <div className="space-y-6 animate-fadeIn h-full flex flex-col">
            {renderTabs()}
            
            <div className="flex-1 overflow-y-auto">
                {activeTab === 'overview' && renderOverview()}
                {activeTab === 'prompts' && renderPrompts()}
                {activeTab === 'knowledge' && renderKnowledge()}
                {activeTab === 'workflows' && renderWorkflows()}
            </div>

            {/* Job Modal */}
            <Modal isOpen={isJobModalOpen} onClose={() => setIsJobModalOpen(false)} title="Start New Training Job">
                <div className="space-y-4">
                    <Input 
                        label="Model Name" 
                        value={newJob.model_name} 
                        onChange={(e) => setNewJob({...newJob, model_name: e.target.value})} 
                        placeholder="e.g., finance-expert-v2"
                    />
                    <Select 
                        label="Base Model" 
                        value={newJob.base_model} 
                        onChange={(e) => setNewJob({...newJob, base_model: e.target.value})}
                    >
                        <option value="llama-3-8b">Llama 3 (8B)</option>
                        <option value="mistral-7b">Mistral (7B)</option>
                        <option value="qwen-1.5-14b">Qwen 1.5 (14B)</option>
                    </Select>
                    <Select 
                        label="Dataset" 
                        value={newJob.dataset_url} 
                        onChange={(e) => setNewJob({...newJob, dataset_url: e.target.value})}
                    >
                        <option value="">Select a dataset...</option>
                        {datasets.map(d => (
                            <option key={d.id} value={d.file_url}>{d.name} ({d.row_count} rows)</option>
                        ))}
                    </Select>
                    <Input 
                        label="Epochs" 
                        type="number"
                        value={newJob.epochs} 
                        onChange={(e) => setNewJob({...newJob, epochs: parseInt(e.target.value)})} 
                    />
                    <div className="flex justify-end gap-2 mt-6">
                        <Button variant="secondary" onClick={() => setIsJobModalOpen(false)}>Cancel</Button>
                        <Button variant="primary" onClick={handleCreateJob} className="bg-[#002366] text-white">Start Training</Button>
                    </div>
                </div>
            </Modal>

            {/* Prompt Modal */}
            <Modal isOpen={isPromptModalOpen} onClose={() => setIsPromptModalOpen(false)} title={editingPrompt.id ? "Edit Prompt" : "Create Prompt"}>
                <div className="space-y-4">
                    <Input 
                        label="Name" 
                        value={editingPrompt.name || ''} 
                        onChange={(e) => setEditingPrompt({...editingPrompt, name: e.target.value})} 
                    />
                    <Input 
                        label="Description" 
                        value={editingPrompt.description || ''} 
                        onChange={(e) => setEditingPrompt({...editingPrompt, description: e.target.value})} 
                    />
                    <Select 
                        label="Category" 
                        value={editingPrompt.category || 'System'} 
                        onChange={(e) => setEditingPrompt({...editingPrompt, category: e.target.value as any})}
                    >
                        <option value="System">System Prompt</option>
                        <option value="User">User Prompt</option>
                        <option value="Assistant">Assistant Response</option>
                        <option value="Tool">Tool Definition</option>
                    </Select>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Content</label>
                        <textarea 
                            className="w-full h-32 p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm font-mono"
                            value={editingPrompt.content || ''}
                            onChange={(e) => setEditingPrompt({...editingPrompt, content: e.target.value})}
                        />
                        <p className="text-xs text-gray-500 mt-1">Use {`{{variable}}`} for dynamic content.</p>
                    </div>
                    <div className="flex justify-end gap-2 mt-6">
                        <Button variant="secondary" onClick={() => setIsPromptModalOpen(false)}>Cancel</Button>
                        <Button variant="primary" onClick={handleSavePrompt} className="bg-[#002366] text-white">Save Prompt</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};
