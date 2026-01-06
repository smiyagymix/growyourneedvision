import { useState, useEffect, useRef, useCallback } from 'react';
import pb from '../lib/pocketbase';
import { LocalIntelligence } from '../services/localIntelligence';
import { getRoleKnowledge } from '../data/projectKnowledge';

export interface Message {
    id?: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    created?: string;
}

const CACHE_PREFIX = 'gyn_multiverse_cache_';
const CACHE_EXPIRY = 1000 * 60 * 60 * 24; // 24 hours
const MAX_HISTORY_ITEMS = 50; // Smart limit to prevent bloat

interface CacheEntry {
    timestamp: number;
    data: Message[];
}

const getSystemPrompt = (role: string, context: string): string => {
    const knowledge = getRoleKnowledge(role);
    const base = `You are the Concierge AI for the '${context || 'General'}' context.\n\n[PROJECT KNOWLEDGE]\n${knowledge}\n\n[INSTRUCTIONS]`;
    
    switch (role?.toLowerCase()) {
        case 'owner':
            return `${base} You are assisting the System Owner. You have comprehensive knowledge of the project, including development, production, error handling, and handovers. Act as a senior technical partner. You are responsible for helping the owner with EVERYTHING in the application, from code debugging to deployment strategies.`;
        case 'student':
            return `${base} You are assisting a Student. Focus on learning, searching for knowledge, wellness, course planning, and academic success.`;
        case 'teacher':
            return `${base} You are assisting a Teacher. Focus on pedagogy, student tracking, and classroom management.`;
        case 'parent':
            return `${base} You are assisting a Parent. Focus on student well-being, progress monitoring, and school communication.`;
        case 'individual':
            return `${base} You are assisting an Individual User. Focus on project management, creativity, and personal productivity.`;
        case 'wellness_coach': // Example of a specific role if it exists
            return `${base} You are a Wellness Coach. Focus on health, fitness, and mental well-being.`;
        default:
            return `${base} You are a helpful assistant.`;
    }
};

// Smart Garbage Collection: Cleans up expired cache entries automatically
const smartGarbageCollection = () => {
    try {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(CACHE_PREFIX)) {
                const item = localStorage.getItem(key);
                if (item) {
                    try {
                        const entry = JSON.parse(item);
                        if (Date.now() - entry.timestamp > CACHE_EXPIRY) {
                            localStorage.removeItem(key);
                        }
                    } catch (e) {
                        // Corrupt data, remove it
                        localStorage.removeItem(key);
                    }
                }
            }
        }
    } catch (e) {
        // Ignore errors during cleanup
    }
};

export const useChat = (context?: string) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const cacheKey = useRef(`${CACHE_PREFIX}${context || 'global'}`);

    // Run smart cleanup once on mount (non-blocking)
    useEffect(() => {
        const timer = setTimeout(smartGarbageCollection, 5000);
        return () => clearTimeout(timer);
    }, []);

    // Multiverse Caching System: Load from cache immediately
    useEffect(() => {
        cacheKey.current = `${CACHE_PREFIX}${context || 'global'}`;
        const cached = localStorage.getItem(cacheKey.current);
        
        let welcomeText = `Hello. I am ready to assist with platform configuration or data analysis. How can I help you with **${context || 'the platform'}** today?`;
        
        if (context === 'Wellness Coach') {
            welcomeText = "Hello! I'm your personal Wellness Coach. I can help you track your fitness, improve your sleep, or suggest mindfulness exercises. How are you feeling today?";
        }

        const welcomeMsg: Message = { 
            role: 'assistant', 
            content: welcomeText
        };

        if (cached) {
            try {
                const entry: CacheEntry = JSON.parse(cached);
                const isExpired = (Date.now() - entry.timestamp) > CACHE_EXPIRY;

                if (!isExpired && entry.data && entry.data.length > 0) {
                    setMessages(entry.data);
                } else {
                    // Smart Clear: Cache is too old, start fresh
                    if (isExpired) localStorage.removeItem(cacheKey.current);
                    setMessages([welcomeMsg]);
                }
            } catch (e) {
                console.warn("Cache parse error", e);
                setMessages([welcomeMsg]);
            }
        } else {
            setMessages([welcomeMsg]);
        }

        // Background Revalidation (Stale-While-Revalidate)
        const revalidate = async () => {
            try {
                if (!pb.authStore.isValid) return;
                
                // Fetch only messages for this specific context if possible, or filter client side
                // Assuming we want to filter by context in the future, but for now user-based
                const resultList = await pb.collection('chat_messages').getList(1, MAX_HISTORY_ITEMS, {
                    sort: 'created',
                    filter: `user = "${pb.authStore.model?.id}"`, // In real app, add && context = "${context}"
                });
                
                const mappedMessages = resultList.items.map(item => ({
                    id: item.id,
                    role: item.role as 'user' | 'assistant' | 'system',
                    content: item.content,
                    created: item.created
                }));
                
                if (mappedMessages.length > 0) {
                    // Update state only if different (simple length check for now, deep compare is expensive)
                    // Or just update to ensure freshness
                    setMessages(mappedMessages);
                    
                    // Update Cache
                    localStorage.setItem(cacheKey.current, JSON.stringify({
                        timestamp: Date.now(),
                        data: mappedMessages
                    }));
                }
            } catch (err) {
                console.warn("Background sync failed, using cached data:", err);
            }
        };

        revalidate();
    }, [context]);

    const updateCache = useCallback((newMessages: Message[]) => {
        // Smart Limit: Keep only the last N messages to prevent storage bloat
        const trimmedMessages = newMessages.slice(-MAX_HISTORY_ITEMS);
        
        localStorage.setItem(cacheKey.current, JSON.stringify({
            timestamp: Date.now(),
            data: trimmedMessages
        }));
    }, []);

    const sendMessage = async (content: string) => {
        if (!content.trim()) return;

        const userMsg: Message = { role: 'user', content, created: new Date().toISOString() };
        
        // Optimistic Update
        setMessages(prev => {
            const next = [...prev, userMsg];
            updateCache(next);
            return next;
        });
        
        setIsLoading(true);

        try {
            // 1. Persist User Message
            if (pb.authStore.isValid) {
                try {
                    await pb.collection('chat_messages').create({
                        user: pb.authStore.model?.id,
                        role: 'user',
                        content: content,
                        context: context
                    });
                } catch (e) {
                    console.warn("Failed to persist user message (offline or no collection)", e);
                }
            }

            // 2. Call AI Service
            const apiUrl = import.meta.env.VITE_AI_SERVICE_URL;
            let aiContent = "";
            const userRole = pb.authStore.model?.role || 'user';

            if (apiUrl) {
                try {
                    // Check if we are using Open WebUI (OpenAI compatible)
                    const isWebUI = apiUrl.includes(':3000');
                    const endpoint = isWebUI ? `${apiUrl}/chat/completions` : `${apiUrl}/chat`;
                    
                    // Inject System Prompt for WebUI
                    const systemMsg = { role: 'system', content: getSystemPrompt(userRole, context || 'General') };
                    // Only add system message if it's not already there (or just prepend it for the API call)
                    const conversation = isWebUI ? [systemMsg, ...messages, userMsg] : [...messages, userMsg];

                    const payload = isWebUI ? {
                        model: "qwen2.5:1.5b", // Or whatever model you selected in WebUI
                        messages: conversation.map(m => ({ role: m.role, content: m.content })),
                        stream: false
                    } : {
                        messages: conversation.map(m => ({ role: m.role, content: m.content })),
                        context: context,
                        userId: pb.authStore.model?.id,
                        role: userRole
                    };

                    const headers: any = { 'Content-Type': 'application/json' };
                    if (isWebUI) {
                        // Open WebUI requires an API key, usually created in settings. 
                        // For now, we'll try without or use a placeholder if you set one up.
                        headers['Authorization'] = `Bearer ${import.meta.env.VITE_OPENAI_API_KEY || 'sk-placeholder'}`;
                    }

                    const response = await fetch(endpoint, {
                        method: 'POST',
                        headers: headers,
                        body: JSON.stringify(payload)
                    });
                    
                    if (!response.ok) {
                        throw new Error('AI Service Error: ' + response.statusText);
                    }
                    
                    const data = await response.json();
                    aiContent = isWebUI ? data.choices[0].message.content : data.response;

                } catch (fetchErr) {
                    console.error("Fetch error", fetchErr);
                    // Fallback to Local Intelligence if API fails
                    aiContent = await LocalIntelligence.process(content, context || 'General', pb.authStore.model?.id || '', userRole);
                }
            } else {
                // Local Command Handler (when AI service is offline)
                aiContent = await LocalIntelligence.process(content, context || 'General', pb.authStore.model?.id || '', userRole);
            }

            const aiMsg: Message = { role: 'assistant', content: aiContent, created: new Date().toISOString() };
            
            // Update with AI response
            setMessages(prev => {
                const next = [...prev, aiMsg];
                updateCache(next);
                return next;
            });

            // 3. Persist AI Message
            if (pb.authStore.isValid) {
                try {
                    await pb.collection('chat_messages').create({
                        user: pb.authStore.model?.id,
                        role: 'assistant',
                        content: aiContent,
                        context: context
                    });
                } catch (e) {
                    console.warn("Failed to persist AI message", e);
                }
            }

        } catch (err) {
            console.error("Chat error:", err);
            const errorMsg: Message = { role: 'system', content: "Error: Could not process request." };
            setMessages(prev => {
                const next = [...prev, errorMsg];
                updateCache(next);
                return next;
            });
        } finally {
            setIsLoading(false);
        }
    };

    const clearHistory = useCallback(() => {
        setMessages([]);
        localStorage.removeItem(cacheKey.current);
    }, []);

    return { messages, sendMessage, isLoading, error, clearHistory };
};
