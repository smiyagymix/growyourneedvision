/**
 * AI Playground Service
 * Interactive testing environment for AI models
 */

import pb from '../lib/pocketbase';
import { isMockEnv } from '../utils/mockData';
import { RecordModel } from 'pocketbase';
import { auditLog } from './auditLogger';
import env from '../config/environment';

export interface AIModel {
    id: string;
    name: string;
    provider: 'openai' | 'anthropic' | 'google' | 'meta' | 'mistral';
    display_name: string;
    cost_per_1k_input: number;
    cost_per_1k_output: number;
    max_tokens: number;
    context_window?: number;
    capabilities?: string[];
    tier: 'free' | 'standard' | 'premium';
    available: boolean;
}

export interface PlaygroundParams {
    temperature: number;
    max_tokens: number;
    top_p?: number;
    frequency_penalty?: number;
    presence_penalty?: number;
    stop_sequences?: string[];
    system_prompt?: string;
}

export interface ModelResponse {
    model: string;
    response: string;
    time_ms: number;
    cost: number;
    tokens_input: number;
    tokens_output: number;
    error?: string;
    finish_reason?: 'stop' | 'length' | 'content_filter' | 'error';
}

export interface PlaygroundTest extends RecordModel {
    id: string;
    prompt: string;
    models: {
        model: string;
        params: PlaygroundParams;
    }[];
    responses?: ModelResponse[];
    created_by: string;
    tags?: string[];
    is_favorite?: boolean;
    notes?: string;
    created: string;
    updated: string;
}

export interface ComparisonResult {
    winner?: string;
    metrics: {
        fastest: string;
        cheapest: string;
        mostVerbose: string;
        shortestLatency: number;
        lowestCost: number;
    };
    scores: Record<string, number>;
}

export const AVAILABLE_MODELS: AIModel[] = [
    {
        id: 'gpt-3.5-turbo',
        name: 'gpt-3.5-turbo',
        provider: 'openai',
        display_name: 'GPT-3.5 Turbo',
        cost_per_1k_input: 0.0005,
        cost_per_1k_output: 0.0015,
        max_tokens: 4096,
        context_window: 16385,
        capabilities: ['chat', 'code', 'analysis'],
        tier: 'standard',
        available: true
    },
    {
        id: 'gpt-4',
        name: 'gpt-4',
        provider: 'openai',
        display_name: 'GPT-4',
        cost_per_1k_input: 0.03,
        cost_per_1k_output: 0.06,
        max_tokens: 8192,
        context_window: 8192,
        capabilities: ['chat', 'code', 'analysis', 'reasoning'],
        tier: 'premium',
        available: true
    },
    {
        id: 'gpt-4-turbo',
        name: 'gpt-4-turbo-preview',
        provider: 'openai',
        display_name: 'GPT-4 Turbo',
        cost_per_1k_input: 0.01,
        cost_per_1k_output: 0.03,
        max_tokens: 4096,
        context_window: 128000,
        capabilities: ['chat', 'code', 'analysis', 'reasoning', 'vision'],
        tier: 'premium',
        available: true
    },
    {
        id: 'gpt-4o',
        name: 'gpt-4o',
        provider: 'openai',
        display_name: 'GPT-4o',
        cost_per_1k_input: 0.005,
        cost_per_1k_output: 0.015,
        max_tokens: 4096,
        context_window: 128000,
        capabilities: ['chat', 'code', 'analysis', 'reasoning', 'vision', 'audio'],
        tier: 'premium',
        available: true
    },
    {
        id: 'claude-3-opus',
        name: 'claude-3-opus-20240229',
        provider: 'anthropic',
        display_name: 'Claude 3 Opus',
        cost_per_1k_input: 0.015,
        cost_per_1k_output: 0.075,
        max_tokens: 4096,
        context_window: 200000,
        capabilities: ['chat', 'code', 'analysis', 'reasoning', 'vision'],
        tier: 'premium',
        available: true
    },
    {
        id: 'claude-3.5-sonnet',
        name: 'claude-3-5-sonnet-20241022',
        provider: 'anthropic',
        display_name: 'Claude 3.5 Sonnet',
        cost_per_1k_input: 0.003,
        cost_per_1k_output: 0.015,
        max_tokens: 8192,
        context_window: 200000,
        capabilities: ['chat', 'code', 'analysis', 'reasoning', 'vision'],
        tier: 'standard',
        available: true
    },
    {
        id: 'claude-3-haiku',
        name: 'claude-3-haiku-20240307',
        provider: 'anthropic',
        display_name: 'Claude 3 Haiku',
        cost_per_1k_input: 0.00025,
        cost_per_1k_output: 0.00125,
        max_tokens: 4096,
        context_window: 200000,
        capabilities: ['chat', 'code', 'analysis'],
        tier: 'free',
        available: true
    },
    {
        id: 'gemini-pro',
        name: 'gemini-pro',
        provider: 'google',
        display_name: 'Gemini Pro',
        cost_per_1k_input: 0.00025,
        cost_per_1k_output: 0.0005,
        max_tokens: 32000,
        context_window: 32000,
        capabilities: ['chat', 'code', 'analysis'],
        tier: 'standard',
        available: true
    },
    {
        id: 'gemini-1.5-pro',
        name: 'gemini-1.5-pro',
        provider: 'google',
        display_name: 'Gemini 1.5 Pro',
        cost_per_1k_input: 0.00125,
        cost_per_1k_output: 0.005,
        max_tokens: 8192,
        context_window: 1000000,
        capabilities: ['chat', 'code', 'analysis', 'reasoning', 'vision', 'audio'],
        tier: 'premium',
        available: true
    },
    {
        id: 'mistral-large',
        name: 'mistral-large-latest',
        provider: 'mistral',
        display_name: 'Mistral Large',
        cost_per_1k_input: 0.004,
        cost_per_1k_output: 0.012,
        max_tokens: 32000,
        context_window: 32000,
        capabilities: ['chat', 'code', 'analysis', 'reasoning'],
        tier: 'standard',
        available: true
    }
];

const MOCK_TESTS: PlaygroundTest[] = [
    {
        id: 'test-1',
        collectionId: 'mock',
        collectionName: 'ai_playground_tests',
        prompt: 'Explain the concept of recursion in programming with a simple example.',
        models: [
            { model: 'gpt-4', params: { temperature: 0.7, max_tokens: 500 } },
            { model: 'claude-3.5-sonnet', params: { temperature: 0.7, max_tokens: 500 } }
        ],
        responses: [
            {
                model: 'gpt-4',
                response: 'Recursion is a programming technique where a function calls itself to solve a problem...',
                time_ms: 1250,
                cost: 0.0024,
                tokens_input: 15,
                tokens_output: 120,
                finish_reason: 'stop'
            },
            {
                model: 'claude-3.5-sonnet',
                response: 'Recursion is when a function solves a problem by breaking it into smaller instances...',
                time_ms: 980,
                cost: 0.0018,
                tokens_input: 15,
                tokens_output: 115,
                finish_reason: 'stop'
            }
        ],
        created_by: 'user-1',
        tags: ['programming', 'education'],
        is_favorite: true,
        created: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        updated: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    },
    {
        id: 'test-2',
        collectionId: 'mock',
        collectionName: 'ai_playground_tests',
        prompt: 'Write a haiku about artificial intelligence.',
        models: [
            { model: 'gpt-3.5-turbo', params: { temperature: 1.0, max_tokens: 100 } }
        ],
        responses: [
            {
                model: 'gpt-3.5-turbo',
                response: 'Silicon minds wake\nLearning patterns in the dark\nFuture dreams take shape',
                time_ms: 450,
                cost: 0.0003,
                tokens_input: 8,
                tokens_output: 20,
                finish_reason: 'stop'
            }
        ],
        created_by: 'user-1',
        tags: ['creative', 'poetry'],
        created: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        updated: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    }
];

class AIPlaygroundService {
    private collection = 'ai_playground_tests';

    /**
     * Test a prompt with specified models
     */
    async testPrompt(
        prompt: string,
        models: string[],
        params: PlaygroundParams,
        userId?: string
    ): Promise<PlaygroundTest> {
        const responses: ModelResponse[] = [];

        for (const modelId of models) {
            const model = AVAILABLE_MODELS.find(m => m.id === modelId);
            if (!model) {
                responses.push({
                    model: modelId,
                    response: '',
                    time_ms: 0,
                    cost: 0,
                    tokens_input: 0,
                    tokens_output: 0,
                    error: `Model ${modelId} not found`,
                    finish_reason: 'error'
                });
                continue;
            }

            if (!model.available) {
                responses.push({
                    model: modelId,
                    response: '',
                    time_ms: 0,
                    cost: 0,
                    tokens_input: 0,
                    tokens_output: 0,
                    error: `Model ${model.display_name} is currently unavailable`,
                    finish_reason: 'error'
                });
                continue;
            }

            try {
                const startTime = Date.now();
                
                // Call actual AI service if configured
                const aiServiceUrl = env.get('aiServiceUrl');
                let response: string;
                let tokensInput: number;
                let tokensOutput: number;
                const finishReason: ModelResponse['finish_reason'] = 'stop';

                if (aiServiceUrl && !isMockEnv()) {
                    try {
                        const aiResponse = await fetch(`${aiServiceUrl}/chat`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                query: prompt,
                                model: model.name,
                                temperature: params.temperature,
                                max_tokens: params.max_tokens,
                                system_prompt: params.system_prompt
                            })
                        });
                        
                        if (aiResponse.ok) {
                            const data = await aiResponse.json();
                            response = data.response || data.message || '';
                            tokensInput = data.tokens_input || Math.ceil(prompt.split(' ').length * 1.3);
                            tokensOutput = data.tokens_output || Math.ceil(response.split(' ').length * 1.3);
                        } else {
                            throw new Error(`AI service returned ${aiResponse.status}`);
                        }
                    } catch (aiError) {
                        console.warn('AI service call failed, using mock:', aiError);
                        // Fallback to mock
                        response = this.generateMockResponse(prompt, model);
                        tokensInput = Math.ceil(prompt.split(' ').length * 1.3);
                        tokensOutput = Math.ceil(response.split(' ').length * 1.3);
                    }
                } else {
                    // Mock response
                    await new Promise(resolve => setTimeout(resolve, Math.random() * 1500 + 300));
                    response = this.generateMockResponse(prompt, model);
                    tokensInput = Math.ceil(prompt.split(' ').length * 1.3);
                    tokensOutput = Math.ceil(response.split(' ').length * 1.3);
                }

                const timeMs = Date.now() - startTime;
                const cost = this.calculateCost(tokensInput, tokensOutput, model);

                responses.push({
                    model: modelId,
                    response,
                    time_ms: timeMs,
                    cost,
                    tokens_input: tokensInput,
                    tokens_output: tokensOutput,
                    finish_reason: finishReason
                });
            } catch (error) {
                responses.push({
                    model: modelId,
                    response: '',
                    time_ms: 0,
                    cost: 0,
                    tokens_input: 0,
                    tokens_output: 0,
                    error: error instanceof Error ? error.message : 'Unknown error',
                    finish_reason: 'error'
                });
            }
        }

        // Save test to database
        const testData = {
            prompt,
            models: models.map(m => ({ model: m, params })),
            responses,
            created_by: userId || 'anonymous'
        };

        if (isMockEnv()) {
            const newTest: PlaygroundTest = {
                id: `test-${Date.now()}`,
                collectionId: 'mock',
                collectionName: 'ai_playground_tests',
                ...testData,
                created: new Date().toISOString(),
                updated: new Date().toISOString()
            };
            MOCK_TESTS.unshift(newTest);
            return newTest;
        }

        try {
            const savedTest = await pb.collection(this.collection).create(testData, {
                requestKey: null
            });
            
            await auditLog.log('ai_playground.test', {
                test_id: savedTest.id,
                models,
                tokens_total: responses.reduce((sum, r) => sum + r.tokens_input + r.tokens_output, 0),
                cost_total: responses.reduce((sum, r) => sum + r.cost, 0)
            }, 'info');
            
            return savedTest as unknown as PlaygroundTest;
        } catch (error) {
            console.error('Error saving test:', error);
            // Return unsaved test data
            return {
                id: `temp-${Date.now()}`,
                collectionId: '',
                collectionName: '',
                ...testData,
                created: new Date().toISOString(),
                updated: new Date().toISOString()
            };
        }
    }

    /**
     * Generate a mock response for testing
     */
    private generateMockResponse(prompt: string, model: AIModel): string {
        const promptLower = prompt.toLowerCase();
        
        if (promptLower.includes('code') || promptLower.includes('function') || promptLower.includes('program')) {
            return `Here's a ${model.display_name} implementation:\n\n\`\`\`javascript\nfunction example() {\n  // Implementation details\n  return result;\n}\n\`\`\`\n\nThis code demonstrates the requested functionality.`;
        }
        
        if (promptLower.includes('explain') || promptLower.includes('what is')) {
            return `According to ${model.display_name}: ${prompt.replace(/^(explain|what is)/i, '').trim()} is a concept that involves several key aspects. Let me break this down for you...`;
        }
        
        return `This is a response from ${model.display_name} to your query: "${prompt.substring(0, 50)}${prompt.length > 50 ? '...' : ''}".\n\nIn a production environment, this would be the actual AI model response with detailed, contextual information based on the model's training and capabilities.`;
    }

    /**
     * Calculate cost for token usage
     */
    private calculateCost(inputTokens: number, outputTokens: number, model: AIModel): number {
        const cost = (inputTokens / 1000) * model.cost_per_1k_input + 
                     (outputTokens / 1000) * model.cost_per_1k_output;
        return parseFloat(cost.toFixed(6));
    }

    /**
     * Get test history
     */
    async getHistory(limit: number = 50, userId?: string): Promise<PlaygroundTest[]> {
        if (isMockEnv()) {
            const filtered = userId 
                ? MOCK_TESTS.filter(t => t.created_by === userId)
                : MOCK_TESTS;
            return filtered.slice(0, limit);
        }

        try {
            const filter = userId ? `created_by = "${userId}"` : '';
            const tests = await pb.collection(this.collection).getList(1, limit, {
                sort: '-created',
                filter,
                requestKey: null
            });
            return tests.items as unknown as PlaygroundTest[];
        } catch (error) {
            console.error('Error fetching history:', error);
            return [];
        }
    }

    /**
     * Get a specific test by ID
     */
    async getTest(id: string): Promise<PlaygroundTest | null> {
        if (isMockEnv()) {
            return MOCK_TESTS.find(t => t.id === id) || null;
        }

        try {
            const test = await pb.collection(this.collection).getOne(id, {
                requestKey: null
            });
            return test as unknown as PlaygroundTest;
        } catch (error) {
            console.error('Error fetching test:', error);
            return null;
        }
    }

    /**
     * Delete a test
     */
    async deleteTest(id: string): Promise<boolean> {
        if (isMockEnv()) {
            const idx = MOCK_TESTS.findIndex(t => t.id === id);
            if (idx >= 0) {
                MOCK_TESTS.splice(idx, 1);
                return true;
            }
            return false;
        }

        try {
            await pb.collection(this.collection).delete(id);
            return true;
        } catch (error) {
            console.error('Error deleting test:', error);
            return false;
        }
    }

    /**
     * Toggle favorite status
     */
    async toggleFavorite(id: string): Promise<boolean> {
        if (isMockEnv()) {
            const test = MOCK_TESTS.find(t => t.id === id);
            if (test) {
                test.is_favorite = !test.is_favorite;
                return test.is_favorite;
            }
            return false;
        }

        try {
            const test = await pb.collection(this.collection).getOne(id);
            const newValue = !test.is_favorite;
            await pb.collection(this.collection).update(id, { is_favorite: newValue });
            return newValue;
        } catch (error) {
            console.error('Error toggling favorite:', error);
            return false;
        }
    }

    /**
     * Add tags to a test
     */
    async addTags(id: string, tags: string[]): Promise<PlaygroundTest | null> {
        if (isMockEnv()) {
            const test = MOCK_TESTS.find(t => t.id === id);
            if (test) {
                test.tags = [...new Set([...(test.tags || []), ...tags])];
                return test;
            }
            return null;
        }

        try {
            const test = await pb.collection(this.collection).getOne(id);
            const existingTags = test.tags || [];
            const newTags = [...new Set([...existingTags, ...tags])];
            const updated = await pb.collection(this.collection).update(id, { tags: newTags });
            return updated as unknown as PlaygroundTest;
        } catch (error) {
            console.error('Error adding tags:', error);
            return null;
        }
    }

    /**
     * Add notes to a test
     */
    async addNotes(id: string, notes: string): Promise<PlaygroundTest | null> {
        if (isMockEnv()) {
            const test = MOCK_TESTS.find(t => t.id === id);
            if (test) {
                test.notes = notes;
                return test;
            }
            return null;
        }

        try {
            const updated = await pb.collection(this.collection).update(id, { notes });
            return updated as unknown as PlaygroundTest;
        } catch (error) {
            console.error('Error adding notes:', error);
            return null;
        }
    }

    /**
     * Search tests by prompt or tags
     */
    async searchTests(query: string, limit: number = 20): Promise<PlaygroundTest[]> {
        if (isMockEnv()) {
            const lowerQuery = query.toLowerCase();
            return MOCK_TESTS.filter(t => 
                t.prompt.toLowerCase().includes(lowerQuery) ||
                t.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
            ).slice(0, limit);
        }

        try {
            const tests = await pb.collection(this.collection).getList(1, limit, {
                filter: `prompt ~ "${query}" || tags ~ "${query}"`,
                sort: '-created',
                requestKey: null
            });
            return tests.items as unknown as PlaygroundTest[];
        } catch (error) {
            console.error('Error searching tests:', error);
            return [];
        }
    }

    /**
     * Get favorite tests
     */
    async getFavorites(limit: number = 50): Promise<PlaygroundTest[]> {
        if (isMockEnv()) {
            return MOCK_TESTS.filter(t => t.is_favorite).slice(0, limit);
        }

        try {
            const tests = await pb.collection(this.collection).getList(1, limit, {
                filter: 'is_favorite = true',
                sort: '-created',
                requestKey: null
            });
            return tests.items as unknown as PlaygroundTest[];
        } catch (error) {
            console.error('Error fetching favorites:', error);
            return [];
        }
    }

    /**
     * Compare model responses
     */
    compareResponses(test: PlaygroundTest): ComparisonResult | null {
        if (!test.responses || test.responses.length < 2) {
            return null;
        }

        const validResponses = test.responses.filter(r => !r.error);
        if (validResponses.length < 2) return null;

        const fastest = validResponses.reduce((min, r) => r.time_ms < min.time_ms ? r : min);
        const cheapest = validResponses.reduce((min, r) => r.cost < min.cost ? r : min);
        const mostVerbose = validResponses.reduce((max, r) => r.tokens_output > max.tokens_output ? r : max);

        // Simple scoring: lower time and cost = better, balanced verbosity
        const scores: Record<string, number> = {};
        for (const response of validResponses) {
            const timeScore = 100 - (response.time_ms / fastest.time_ms - 1) * 20;
            const costScore = 100 - (response.cost / cheapest.cost - 1) * 30;
            const verbosityScore = Math.min(100, (response.tokens_output / 100) * 10);
            scores[response.model] = Math.round((timeScore + costScore + verbosityScore) / 3);
        }

        const winner = Object.entries(scores).reduce((best, [model, score]) => 
            score > (scores[best] || 0) ? model : best, validResponses[0].model);

        return {
            winner,
            metrics: {
                fastest: fastest.model,
                cheapest: cheapest.model,
                mostVerbose: mostVerbose.model,
                shortestLatency: fastest.time_ms,
                lowestCost: cheapest.cost
            },
            scores
        };
    }

    /**
     * Calculate cost estimate for a prompt
     */
    estimateCost(prompt: string, modelId: string, expectedOutputTokens: number = 100): number {
        const model = AVAILABLE_MODELS.find(m => m.id === modelId);
        if (!model) return 0;

        const inputTokens = Math.ceil(prompt.split(' ').length * 1.3);
        return this.calculateCost(inputTokens, expectedOutputTokens, model);
    }

    /**
     * Estimate costs for multiple models
     */
    estimateCosts(prompt: string, modelIds: string[], expectedOutputTokens: number = 100): Record<string, number> {
        const costs: Record<string, number> = {};
        for (const modelId of modelIds) {
            costs[modelId] = this.estimateCost(prompt, modelId, expectedOutputTokens);
        }
        return costs;
    }

    /**
     * Get model by ID
     */
    getModel(modelId: string): AIModel | undefined {
        return AVAILABLE_MODELS.find(m => m.id === modelId);
    }

    /**
     * Get all available models
     */
    getAvailableModels(): AIModel[] {
        return AVAILABLE_MODELS;
    }

    /**
     * Get models by provider
     */
    getModelsByProvider(provider: AIModel['provider']): AIModel[] {
        return AVAILABLE_MODELS.filter(m => m.provider === provider);
    }

    /**
     * Get models by tier
     */
    getModelsByTier(tier: AIModel['tier']): AIModel[] {
        return AVAILABLE_MODELS.filter(m => m.tier === tier);
    }

    /**
     * Get models by capability
     */
    getModelsByCapability(capability: string): AIModel[] {
        return AVAILABLE_MODELS.filter(m => m.capabilities?.includes(capability));
    }

    /**
     * Get usage statistics
     */
    async getUsageStats(userId?: string): Promise<{
        totalTests: number;
        totalCost: number;
        totalTokens: number;
        modelUsage: Record<string, number>;
        averageLatency: number;
    }> {
        const history = await this.getHistory(1000, userId);
        
        let totalCost = 0;
        let totalTokens = 0;
        let totalLatency = 0;
        let latencyCount = 0;
        const modelUsage: Record<string, number> = {};

        for (const test of history) {
            if (test.responses) {
                for (const response of test.responses) {
                    totalCost += response.cost;
                    totalTokens += response.tokens_input + response.tokens_output;
                    if (response.time_ms > 0) {
                        totalLatency += response.time_ms;
                        latencyCount++;
                    }
                    modelUsage[response.model] = (modelUsage[response.model] || 0) + 1;
                }
            }
        }

        return {
            totalTests: history.length,
            totalCost: parseFloat(totalCost.toFixed(4)),
            totalTokens,
            modelUsage,
            averageLatency: latencyCount > 0 ? Math.round(totalLatency / latencyCount) : 0
        };
    }

    /**
     * Clone a test with optional modifications
     */
    async cloneTest(id: string, modifications?: { prompt?: string; models?: string[] }): Promise<PlaygroundTest | null> {
        const original = await this.getTest(id);
        if (!original) return null;

        const models = modifications?.models || original.models.map(m => m.model);
        const params = original.models[0]?.params || { temperature: 0.7, max_tokens: 500 };

        return this.testPrompt(
            modifications?.prompt || original.prompt,
            models,
            params,
            original.created_by
        );
    }
}

export const aiPlaygroundService = new AIPlaygroundService();
