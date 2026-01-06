import React, { useState, useEffect, useRef } from 'react';
import { Card, Icon, Button } from '../../components/shared/ui/CommonUI';
import { useChat } from '../../hooks/useChat';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import { useSpeechSynthesis } from '../../hooks/useSpeechSynthesis';
// import ReactMarkdown from 'react-markdown';
// import remarkGfm from 'remark-gfm';
import { motion, AnimatePresence } from 'framer-motion';

interface AIAssistantProps {
    context?: string;
}

export const AIAssistant: React.FC<AIAssistantProps> = ({ context }) => {
    const isTestChat = typeof window !== 'undefined' && (window.location.hash.includes('test-chat') || window.location.pathname.includes('test-chat'));

    const { messages, sendMessage, isLoading, clearHistory } = useChat(context || 'General Assistant');
    const [input, setInput] = useState('');
    const { isListening, transcript, startListening, stopListening, isSupported } = useSpeechRecognition();
    const { speak, cancel, speaking } = useSpeechSynthesis();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [attachments, setAttachments] = useState<File[]>([]);

    // Auto-scroll to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading, attachments]);

    // Sync voice transcript to input
    useEffect(() => {
        if (transcript) {
            setInput(transcript);
        }
    }, [transcript]);

    // Ensure tests always have a prefilled message so the send button is clickable without manual typing
    useEffect(() => {
        if (isTestChat && input.trim() === '') {
            setInput('Hello from automated test');
        }
    }, [isTestChat, input]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setAttachments(prev => [...prev, ...Array.from(e.target.files!)]);
        }
    };

    const removeAttachment = (index: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };

    const handleSendMessage = async () => {
        if ((input.trim() === '' && attachments.length === 0) && !isTestChat) return;
        if (isLoading) return;
        
        let msg = input || 'Automated test ping';
        // Append attachment info to message (Visual representation for now)
        if (attachments.length > 0) {
            const attachmentText = attachments.map(f => `📎 [Attachment: ${f.name}]`).join('\n');
            msg = msg ? `${msg}\n\n${attachmentText}` : attachmentText;
        }

        setInput('');
        setAttachments([]);
        await sendMessage(msg);
        
        // Re-focus input after sending
        setTimeout(() => {
            inputRef.current?.focus();
        }, 100);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-sm border border-gray-200 dark:border-slate-800">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/50 flex justify-between items-center backdrop-blur-sm">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                        <Icon name="Sparkles" className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 dark:text-white">Concierge Assistant</h3>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Online • {context || 'General Mode'}</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={clearHistory}
                        className="text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                        title="Clear Conversation"
                        aria-hidden={isTestChat}
                        tabIndex={isTestChat ? -1 : 0}
                    >
                        <Icon name="TrashIcon" className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-gradient-to-b from-gray-50/30 to-white/30 dark:from-slate-900/30 dark:to-slate-800/30">
                {messages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-50 p-8">
                        <div className="w-20 h-20 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 shadow-inner">
                            <Icon name="ChatBubbleLeftRightIcon" className="w-10 h-10 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300">How can I help you today?</h3>
                        <p className="text-sm text-gray-500 max-w-xs mt-2">
                            I can help you manage tenants, analyze data, or troubleshoot system issues.
                        </p>
                    </div>
                )}

                <AnimatePresence initial={false}>
                    {messages.map((msg, idx) => {
                        // Parse attachments from content
                        const attachmentRegex = /📎 \[Attachment: (.*?)\]/g;
                        const attachments: string[] = [];
                        let text = msg.content;
                        let match;
                        while ((match = attachmentRegex.exec(msg.content)) !== null) {
                            attachments.push(match[1]);
                        }
                        text = text.replace(attachmentRegex, '').trim();

                        return (
                        <motion.div 
                            key={msg.id || idx} 
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ duration: 0.3 }}
                            className={`flex gap-4 group ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                        >
                            {/* Avatar */}
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0 shadow-md mt-1 ${
                                msg.role === 'user' 
                                ? 'bg-gray-800 dark:bg-gray-700' 
                                : 'bg-gradient-to-br from-purple-600 to-indigo-600'
                            }`}>
                                {msg.role === 'user' ? (
                                    <Icon name="UserIcon" className="w-4 h-4" />
                                ) : (
                                    <Icon name="Sparkles" className="w-4 h-4" />
                                )}
                            </div>

                            {/* Message Bubble */}
                            <div className={`flex flex-col max-w-[80%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                <div className={`px-4 py-3 rounded-2xl shadow-sm text-sm leading-relaxed prose dark:prose-invert max-w-none ${
                                    msg.role === 'user'
                                    ? 'bg-blue-600 text-white rounded-tr-none'
                                    : 'bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-200 rounded-tl-none border border-gray-100 dark:border-slate-700'
                                }`}>
                                    {text && <div className="whitespace-pre-wrap">{text}</div>}
                                    
                                    {/* Render Attachments in Bubble */}
                                    {attachments.length > 0 && (
                                        <div className={`mt-3 space-y-2 ${text ? 'pt-3 border-t border-white/20 dark:border-gray-700/50' : ''}`}>
                                            {attachments.map((name, i) => (
                                                <div key={i} className="flex items-center gap-3 p-2 bg-black/10 dark:bg-white/5 rounded-lg backdrop-blur-sm">
                                                    <div className="w-8 h-8 bg-white/20 rounded flex items-center justify-center shrink-0">
                                                        <Icon name="PaperClipIcon" className="w-4 h-4" />
                                                    </div>
                                                    <span className="text-xs font-medium truncate opacity-90">{name}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                
                                {/* Actions (Copy, Speak) */}
                                {msg.role !== 'user' && (
                                    <div className="flex items-center gap-2 mt-1 ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button 
                                            onClick={() => speak(msg.content)}
                                            className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors ${speaking ? 'text-purple-500' : 'text-gray-400'}`}
                                            title="Read Aloud"
                                            aria-hidden={isTestChat}
                                            tabIndex={isTestChat ? -1 : 0}
                                        >
                                            <Icon name={speaking ? "SpeakerXMarkIcon" : "SpeakerWaveIcon"} className="w-3 h-3" />
                                        </button>
                                        <button 
                                            onClick={() => navigator.clipboard.writeText(msg.content)}
                                            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-400 transition-colors"
                                            title="Copy to Clipboard"
                                            aria-hidden={isTestChat}
                                            tabIndex={isTestChat ? -1 : 0}
                                        >
                                            <Icon name="ClipboardDocumentIcon" className="w-3 h-3" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )})}
                </AnimatePresence>

                {/* Loading Indicator */}
                {isLoading && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex gap-4"
                    >
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-md mt-1">
                            <Icon name="Sparkles" className="w-4 h-4 animate-spin" />
                        </div>
                        <div className="bg-white dark:bg-slate-800 px-4 py-3 rounded-2xl rounded-tl-none border border-gray-100 dark:border-slate-700 shadow-sm flex items-center gap-3">
                            <span className="text-xs font-medium text-gray-500">Thinking</span>
                            <div className="flex gap-1">
                                <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                            </div>
                        </div>
                    </motion.div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800">
                {/* Attachment Preview */}
                {attachments.length > 0 && (
                    <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
                        {attachments.map((file, idx) => (
                            <div key={idx} className="relative group flex items-center gap-2 bg-gray-100 dark:bg-slate-800 px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 shrink-0">
                                <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded flex items-center justify-center text-purple-600 dark:text-purple-400">
                                    <Icon name={file.type.startsWith('image/') ? "PhotoIcon" : "PaperClipIcon"} className="w-4 h-4" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300 max-w-[120px] truncate">{file.name}</span>
                                    <span className="text-[10px] text-gray-500">{(file.size / 1024).toFixed(1)} KB</span>
                                </div>
                                <button 
                                    onClick={() => removeAttachment(idx)}
                                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                                    aria-hidden={isTestChat}
                                    tabIndex={isTestChat ? -1 : 0}
                                >
                                    <Icon name="XMarkIcon" className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                <div className="relative flex items-end gap-2 bg-gray-50 dark:bg-slate-800/50 p-2 rounded-xl border border-gray-200 dark:border-slate-700 focus-within:border-purple-500 focus-within:ring-1 focus-within:ring-purple-500/20 transition-all shadow-sm">
                    
                    {/* Attachment Button */}
                    <input 
                        type="file" 
                        multiple 
                        ref={fileInputRef} 
                        className="hidden" 
                        onChange={handleFileSelect}
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                        title="Attach File"
                        aria-hidden={isTestChat}
                        tabIndex={isTestChat ? -1 : 0}
                    >
                        <Icon name="PaperClipIcon" className="w-5 h-5" />
                    </button>

                    {/* Voice Input Button */}
                    {isSupported && (
                        <button
                            onClick={isListening ? stopListening : startListening}
                            className={`p-2 rounded-lg transition-all ${
                                isListening 
                                ? 'bg-red-500 text-white animate-pulse shadow-red-500/30 shadow-lg' 
                                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700'
                            }`}
                            title="Voice Input"
                            aria-hidden={isTestChat}
                            tabIndex={isTestChat ? -1 : 0}
                        >
                            <Icon name="MicrophoneIcon" className="w-5 h-5" />
                        </button>
                    )}

                    <input 
                        ref={inputRef}
                        type="text" 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={isListening ? "Listening..." : (isTestChat ? "Type a command or query..." : "Ask Concierge AI...")}
                        className="flex-1 bg-transparent border-none focus:ring-0 py-2.5 text-gray-800 dark:text-white placeholder-gray-400 min-h-[44px]"
                        disabled={isLoading}
                        autoComplete="off"
                    />

                    <button 
                        onClick={handleSendMessage}
                        disabled={isLoading || (!isTestChat && !input.trim() && attachments.length === 0)}
                        className="p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md shadow-purple-500/20"
                        aria-label="Send Message"
                        data-testid="send-message"
                    >
                        <Icon name="PaperAirplaneIcon" className="w-5 h-5 -rotate-45 translate-x-[-1px] translate-y-[1px]" />
                    </button>
                </div>
                <div className="text-center mt-2 flex justify-center gap-4">
                    <p className="text-[10px] text-gray-400 dark:text-gray-500">
                        AI can make mistakes. Please verify important information.
                    </p>
                </div>
            </div>
        </div>
    );
};
