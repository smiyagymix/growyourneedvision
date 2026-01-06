import React, { useState } from 'react';
import { Card, Icon, Badge, Button } from '../../components/shared/ui/CommonUI';
import { useTestPrompt, usePlaygroundHistory, useDeletePlaygroundTest } from '../../hooks/useAIPlayground';
import { AVAILABLE_MODELS, PlaygroundParams } from '../../services/aiPlaygroundService';
import { useToast } from '../../hooks/useToast';

const AIPlayground: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [selectedModels, setSelectedModels] = useState<string[]>(['gpt-4', 'claude-3-sonnet']);
    const [params, setParams] = useState<PlaygroundParams>({
        temperature: 0.7,
        max_tokens: 500,
        top_p: 1.0,
        frequency_penalty: 0,
        presence_penalty: 0
    });
    const [showHistory, setShowHistory] = useState(false);

    const testMutation = useTestPrompt();
    const { data: history } = usePlaygroundHistory(20);
    const deleteMutation = useDeletePlaygroundTest();

    const handleTest = async () => {
        if (!prompt.trim()) {
            alert('Please enter a prompt');
            return;
        }

        if (selectedModels.length === 0) {
            alert('Please select at least one model');
            return;
        }

        try {
            await testMutation.mutateAsync({ prompt, models: selectedModels, params });
        } catch (error) {
            alert('Failed to test prompt');
        }
    };

    const toggleModel = (modelId: string) => {
        setSelectedModels(prev =>
            prev.includes(modelId)
                ? prev.filter(m => m !== modelId)
                : [...prev, modelId]
        );
    };

    const handleLoadPrompt = (savedPrompt: string) => {
        setPrompt(savedPrompt);
        setShowHistory(false);
    };

    const formatCost = (cost: number) => {
        return `$${cost.toFixed(4)}`;
    };

    const formatTime = (ms: number) => {
        return `${(ms / 1000).toFixed(2)}s`;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">AI Playground</h2>
                <p className="text-sm text-gray-500 mt-1">Test and compare AI models side-by-side</p>
            </div>

            {/* Model Selection */}
            <Card className="p-5">
                <h3 className="font-bold text-gray-900 dark:text-white mb-4">Select Models</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    {AVAILABLE_MODELS.map((model) => (
                        <button
                            key={model.id}
                            onClick={() => toggleModel(model.id)}
                            className={`p-3 rounded-lg border-2 transition-all ${selectedModels.includes(model.id)
                                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                                    : 'border-gray-200 dark:border-gray-700 hover:border-purple-300'
                                }`}
                        >
                            <div className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                                {model.display_name}
                            </div>
                            <div className="text-xs text-gray-500">
                                ${model.cost_per_1k_output.toFixed(3)}/1K
                            </div>
                        </button>
                    ))}
                </div>
            </Card>

            {/* Prompt Input */}
            <Card className="p-5">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-900 dark:text-white">Prompt</h3>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowHistory(!showHistory)}
                    >
                        <Icon name="ClockIcon" className="w-4 h-4 mr-2" />
                        History
                    </Button>
                </div>
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Enter your prompt here..."
                    className="w-full h-32 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />

                {/* Parameters */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Temperature
                        </label>
                        <input
                            type="number"
                            value={params.temperature}
                            onChange={(e) => setParams({ ...params, temperature: parseFloat(e.target.value) })}
                            min="0"
                            max="2"
                            step="0.1"
                            className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Max Tokens
                        </label>
                        <input
                            type="number"
                            value={params.max_tokens}
                            onChange={(e) => setParams({ ...params, max_tokens: parseInt(e.target.value) })}
                            min="1"
                            max="4096"
                            className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Top P
                        </label>
                        <input
                            type="number"
                            value={params.top_p}
                            onChange={(e) => setParams({ ...params, top_p: parseFloat(e.target.value) })}
                            min="0"
                            max="1"
                            step="0.1"
                            className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Freq. Penalty
                        </label>
                        <input
                            type="number"
                            value={params.frequency_penalty}
                            onChange={(e) => setParams({ ...params, frequency_penalty: parseFloat(e.target.value) })}
                            min="-2"
                            max="2"
                            step="0.1"
                            className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Pres. Penalty
                        </label>
                        <input
                            type="number"
                            value={params.presence_penalty}
                            onChange={(e) => setParams({ ...params, presence_penalty: parseFloat(e.target.value) })}
                            min="-2"
                            max="2"
                            step="0.1"
                            className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                        />
                    </div>
                </div>

                <div className="mt-4">
                    <Button
                        variant="primary"
                        onClick={handleTest}
                        disabled={testMutation.isPending}
                        className="w-full md:w-auto"
                    >
                        {testMutation.isPending ? (
                            <>
                                <Icon name="ArrowPathIcon" className="w-4 h-4 mr-2 animate-spin" />
                                Testing...
                            </>
                        ) : (
                            <>
                                <Icon name="PlayIcon" className="w-4 h-4 mr-2" />
                                Generate Responses
                            </>
                        )}
                    </Button>
                </div>
            </Card>

            {/* History Sidebar */}
            {showHistory && (
                <Card className="p-5">
                    <h3 className="font-bold text-gray-900 dark:text-white mb-4">Recent Tests</h3>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                        {history?.map((test) => (
                            <div
                                key={test.id}
                                className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer"
                                onClick={() => handleLoadPrompt(test.prompt)}
                            >
                                <p className="text-sm text-gray-900 dark:text-white line-clamp-2 mb-2">
                                    {test.prompt}
                                </p>
                                <div className="flex items-center justify-between text-xs text-gray-500">
                                    <span>{new Date(test.created).toLocaleString()}</span>
                                    <span>{test.models?.length || 0} models</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            {/* Responses */}
            {testMutation.data && (
                <div>
                    <h3 className="font-bold text-gray-900 dark:text-white mb-4">Responses</h3>
                    <div className={`grid grid-cols-1 ${selectedModels.length > 1 ? 'md:grid-cols-2' : ''} gap-4`}>
                        {testMutation.data.responses?.map((response, idx) => {
                            const model = AVAILABLE_MODELS.find(m => m.id === response.model);
                            return (
                                <Card key={idx} className="p-5">
                                    <div className="flex items-center justify-between mb-3">
                                        <h4 className="font-bold text-gray-900 dark:text-white">
                                            {model?.display_name || response.model}
                                        </h4>
                                        {response.error ? (
                                            <Badge variant="danger">Error</Badge>
                                        ) : (
                                            <Badge variant="success">Success</Badge>
                                        )}
                                    </div>

                                    {response.error ? (
                                        <p className="text-sm text-red-600 dark:text-red-400">{response.error}</p>
                                    ) : (
                                        <>
                                            <p className="text-sm text-gray-700 dark:text-gray-300 mb-4 whitespace-pre-wrap">
                                                {response.response}
                                            </p>

                                            <div className="grid grid-cols-3 gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                                                <div className="text-center">
                                                    <div className="text-xs text-gray-500 mb-1">Time</div>
                                                    <div className="text-sm font-bold text-gray-900 dark:text-white">
                                                        {formatTime(response.time_ms)}
                                                    </div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="text-xs text-gray-500 mb-1">Cost</div>
                                                    <div className="text-sm font-bold text-gray-900 dark:text-white">
                                                        {formatCost(response.cost)}
                                                    </div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="text-xs text-gray-500 mb-1">Tokens</div>
                                                    <div className="text-sm font-bold text-gray-900 dark:text-white">
                                                        {response.tokens_output}
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </Card>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Info Alert */}
            <Card className="p-4 bg-purple-50 dark:bg-purple-900/20 border-purple-200">
                <div className="flex gap-3">
                    <Icon name="InformationCircleIcon" className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                        <p className="font-semibold text-purple-900 dark:text-purple-100">AI Playground</p>
                        <p className="text-purple-700 dark:text-purple-200">
                            Currently simulating AI responses. Connect API keys in Settings to test real models.
                            Costs and response times are estimates.
                        </p>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default AIPlayground;
