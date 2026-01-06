import React, { useState, useEffect, useRef } from 'react';
import { Button, Card, Icon } from './ui/CommonUI';
import { useChat } from '../../hooks/useChat';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import { useSpeechSynthesis } from '../../hooks/useSpeechSynthesis';

interface RoleBasedAIChatProps {
  role: string; // 'student', 'teacher', 'parent', 'admin'
  context?: string; // Additional context like "Viewing Grades"
  title?: string;
  subtitle?: string;
}

export const RoleBasedAIChat: React.FC<RoleBasedAIChatProps> = ({ role, context, title, subtitle }) => {
  const { messages, sendMessage, isLoading } = useChat(`Role: ${role}. Context: ${context || 'General Dashboard'}`);
  const [input, setInput] = useState('');
  const { isListening, transcript, startListening, stopListening, isSupported } = useSpeechRecognition();
  const { speak } = useSpeechSynthesis();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (transcript) {
        setInput(transcript);
    }
  }, [transcript]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
      if (!input.trim()) return;
      await sendMessage(input);
      setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          handleSendMessage();
      }
  };

  return (
    <div className="h-[600px] flex flex-col gap-4 animate-fadeIn">
        <div className="bg-gradient-to-r from-gyn-blue-dark to-gyn-blue-medium dark:from-slate-800 dark:to-slate-900 p-6 rounded-2xl text-white shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
            <div className="relative z-10 flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center shadow-inner">
                    <Icon name="Sparkles" className="w-6 h-6 text-yellow-300" />
                </div>
                <div>
                    <h2 className="text-2xl font-black tracking-tight">{title || 'AI Assistant'}</h2>
                    <p className="text-blue-100 text-sm font-medium">{subtitle || 'How can I help you today?'}</p>
                </div>
            </div>
        </div>

        <Card className="flex-1 flex flex-col overflow-hidden p-0 border border-gray-200 dark:border-slate-700 shadow-xl">
            {/* Chat Area */}
            <div className="flex-1 bg-gray-50/50 dark:bg-slate-900/50 p-6 overflow-y-auto space-y-6">
                {messages.length === 0 && (
                    <div className="text-center text-gray-400 mt-10">
                        <Icon name="ChatBubbleLeftRight" className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p>Start a conversation with your AI assistant.</p>
                    </div>
                )}
                
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex gap-4 group ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0 shadow-md ${
                            msg.role === 'user' 
                            ? 'bg-gray-700 dark:bg-slate-600' 
                            : 'bg-gradient-to-br from-blue-500 to-purple-600'
                        }`}>
                            {msg.role === 'user' ? (
                                <Icon name="UserIcon" className="w-4 h-4" />
                            ) : (
                                <Icon name="Sparkles" className="w-4 h-4" />
                            )}
                        </div>
                        <div className={`p-3 rounded-2xl shadow-sm max-w-[80%] text-sm leading-relaxed ${
                            msg.role === 'user'
                            ? 'bg-white dark:bg-slate-700 text-gray-800 dark:text-white rounded-tr-none border border-gray-100 dark:border-slate-600'
                            : 'bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-100 rounded-tl-none border border-blue-100 dark:border-blue-800'
                        }`}>
                            {msg.content}
                            {msg.role !== 'user' && (
                                <div className="mt-1 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                        onClick={() => speak(msg.content)}
                                        className="text-blue-400 hover:text-blue-600 transition-colors"
                                        title="Read aloud"
                                    >
                                        <Icon name="SpeakerWaveIcon" className="w-3 h-3" />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex gap-4">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white shrink-0">
                            <Icon name="Sparkles" className="w-4 h-4 animate-pulse" />
                        </div>
                        <div className="bg-gray-100 dark:bg-slate-800 p-3 rounded-2xl rounded-tl-none text-xs text-gray-500 italic">
                            Thinking...
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700">
                <div className="relative flex gap-2">
                    <input 
                        type="text" 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={isListening ? "Listening..." : "Ask anything..."}
                        className={`flex-1 pl-4 pr-12 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${isListening ? 'border-red-400 animate-pulse' : ''}`}
                        disabled={isLoading}
                    />
                    
                    {isSupported && (
                        <button
                            onClick={isListening ? stopListening : startListening}
                            className={`p-3 rounded-xl transition-colors flex items-center justify-center ${isListening ? 'bg-red-500 text-white' : 'bg-gray-100 dark:bg-slate-700 text-gray-500 hover:bg-gray-200 dark:hover:bg-slate-600'}`}
                            title="Voice Input"
                        >
                            <Icon name="MicrophoneIcon" className="w-5 h-5" />
                        </button>
                    )}
                    
                    <button 
                        onClick={handleSendMessage}
                        disabled={isLoading || !input.trim()}
                        className="p-3 bg-gyn-blue-dark dark:bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                    >
                        <Icon name="PaperAirplaneIcon" className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </Card>
    </div>
  );
};
