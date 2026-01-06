
import React, { useState, useEffect, Suspense } from 'react';
import { Card, Icon } from '../components/shared/ui/CommonUI';
import { aiService } from '../services/aiService';
// import { AIOperations } from './concierge_ai/AIOperations';
// import { AIDevelopment } from './concierge_ai/AIDevelopment';
import { AIAnalytics } from './concierge_ai/AIAnalytics';
// import { AIStrategy } from './concierge_ai/AIStrategy';
// import { AISettings } from './concierge_ai/AISettings';
import { AIAssistant } from './concierge_ai/AIAssistant';

// Lazy load AI development components
const AIIntelligenceLevels = React.lazy(() => import('./ai/AIIntelligenceLevels'));
const AIPlayground = React.lazy(() => import('./ai/AIPlayground'));
const AIFineTuningManager = React.lazy(() => import('./ai/AIFineTuningManager'));
const AICostDashboard = React.lazy(() => import('./ai/AICostDashboard'));
const AIUsageAnalytics = React.lazy(() => import('./ai/AIUsageAnalytics'));

interface ConciergeAIProps {
    activeTab: string;
    activeSubNav: string;
}

interface SystemStats {
    latency: string;
    error_rate: string;
    load: string;
    tokens_total: string;
    tokens_input: string;
    tokens_output: string;
    provider?: string;
}

const ConciergeAI: React.FC<ConciergeAIProps> = ({ activeTab, activeSubNav }) => {

    const [stats, setStats] = useState<SystemStats>({
        latency: '--', error_rate: '--', load: '--',
        tokens_total: '0', tokens_input: '0', tokens_output: '0',
        provider: 'Loading...'
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await aiService.getSystemStats();
                setStats({
                    latency: data.latency || '24ms',
                    error_rate: data.error_rate || '0.0%',
                    load: data.load || 'Low',
                    tokens_total: data.tokens_total || '0',
                    tokens_input: data.tokens_input || '0',
                    tokens_output: data.tokens_output || '0',
                    provider: data.provider || 'OpenAI'
                });
            } catch (err) {
                console.error("Failed to fetch AI stats:", err);
                setStats(prev => ({ ...prev, provider: 'OFFLINE' }));
            }
        };
        fetchStats();
    }, []);

    return (
        <div className="w-full h-full flex flex-col text-gray-800 dark:text-white">
            {/* Holographic Header Card */}
            <div className="bg-[#050510] dark:bg-black relative rounded-2xl p-8 mb-6 shadow-2xl overflow-hidden border border-white/10 group">
                {/* Animated Background Mesh */}
                <div className="absolute inset-0 opacity-30">
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-600 rounded-full mix-blend-screen filter blur-[100px] opacity-20 animate-pulse"></div>
                    <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-600 rounded-full mix-blend-screen filter blur-[80px] opacity-20"></div>
                </div>

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        <h1 className="text-4xl font-black mb-2 flex items-center gap-3 text-white tracking-tight">
                            <Icon name="Sparkles" className="w-10 h-10 text-transparent bg-clip-text bg-gradient-to-br from-yellow-300 to-orange-500" />
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-100 to-gray-400">Concierge AI</span>
                        </h1>
                        <p className="text-gray-400 max-w-xl text-sm font-medium">
                            Central intelligence hub. Configure models, monitor performance, and train the platform assistant.
                        </p>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="text-right hidden md:block border-r border-white/10 pr-6">
                            <div className="text-[10px] font-mono text-purple-400 mb-1 uppercase tracking-widest">Active Provider</div>
                            <div className="font-bold text-xl text-white font-machina uppercase">{stats.provider || 'OFFLINE'}</div>
                        </div>
                        <div className="text-center">
                            <div className="w-16 h-16 rounded-full border-2 border-purple-500/30 flex items-center justify-center relative">
                                <div className="absolute inset-0 bg-purple-500/20 rounded-full animate-ping"></div>
                                <Icon name="CpuChipIcon" className="w-8 h-8 text-purple-400" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {activeTab === 'Analytics' && activeSubNav === 'Cost' ? (
                <Suspense fallback={
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                    </div>
                }>
                    <AICostDashboard />
                </Suspense>
            ) : activeTab === 'Analytics' ? (
                <AIAnalytics />
            ) : activeTab === 'Development' && activeSubNav === 'Intelligence Levels' ? (
                <Suspense fallback={
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                    </div>
                }>
                    <AIIntelligenceLevels />
                </Suspense>
            ) : activeTab === 'Development' && activeSubNav === 'Playground' ? (
                <Suspense fallback={
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                    </div>
                }>
                    <AIPlayground />
                </Suspense>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
                    <div className="lg:col-span-2 h-full min-h-0">
                        <AIAssistant context={activeSubNav || 'General'} />
                    </div>

                    <div className="flex flex-col gap-6 h-full overflow-y-auto">
                        <Card className="p-6 flex-1">
                            <h3 className="font-bold text-gyn-blue-dark dark:text-blue-400 mb-4 text-sm uppercase tracking-wider">Token Usage</h3>
                            <div className="h-40 bg-gradient-to-br from-gray-50 to-white dark:from-slate-800 dark:to-slate-700 rounded-xl border border-gray-200/50 dark:border-slate-600 shadow-inner flex items-center justify-center relative overflow-hidden">
                                <svg className="absolute inset-0 w-full h-full text-purple-100 dark:text-purple-900/20" viewBox="0 0 100 100" preserveAspectRatio="none">
                                    <path d="M0 80 C 20 70, 40 90, 60 50 S 80 20, 100 40 L 100 100 L 0 100 Z" fill="currentColor" />
                                </svg>
                                <div className="relative z-10 text-center">
                                    <span className="text-3xl font-black text-gyn-blue-dark dark:text-white">{stats.tokens_total}</span>
                                    <div className="text-[10px] font-bold text-gray-400 uppercase mt-1">Total Tokens</div>
                                </div>
                            </div>

                            <div className="mt-4 grid grid-cols-2 gap-3">
                                <div className="bg-blue-50/50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 p-3 rounded-lg text-center">
                                    <div className="text-[9px] font-bold text-blue-400 uppercase">Input</div>
                                    <div className="text-sm font-bold text-blue-700 dark:text-blue-300">{stats.tokens_input}</div>
                                </div>
                                <div className="bg-purple-50/50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800 p-3 rounded-lg text-center">
                                    <div className="text-[9px] font-bold text-purple-400 uppercase">Output</div>
                                    <div className="text-sm font-bold text-purple-700 dark:text-purple-300">{stats.tokens_output}</div>
                                </div>
                            </div>
                        </Card>

                        <Card className="p-6">
                            <h3 className="font-bold text-gyn-blue-dark dark:text-blue-400 mb-4 text-sm uppercase tracking-wider">System Health</h3>
                            <div className="space-y-4">
                                {[
                                    { label: 'Latency', val: stats.latency, color: 'bg-green-500' },
                                    { label: 'Error Rate', val: stats.error_rate, color: 'bg-blue-500' },
                                    { label: 'Load', val: stats.load, color: 'bg-yellow-500' }
                                ].map(m => (
                                    <div key={m.label} className="flex flex-col gap-1">
                                        <div className="flex justify-between text-xs font-bold text-gray-600 dark:text-slate-400">
                                            <span>{m.label}</span>
                                            <span>{m.val}</span>
                                        </div>
                                        <div className="h-2 w-full bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden shadow-inner">
                                            <div className={`h-full rounded-full ${m.color} shadow-[0_0_10px_rgba(0,0,0,0.2)]`} style={{ width: '70%' }}></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ConciergeAI;
