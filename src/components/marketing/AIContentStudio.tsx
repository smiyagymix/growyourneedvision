import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Wand2, FileText, Image, Video, MessageSquare, Mail,
  Hash, Globe, RefreshCw, Copy, Check, CheckCircle, ThumbsUp, ThumbsDown,
  Settings, Sliders, Clock, Zap, BookOpen, Lightbulb, Target
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { marketingService } from '../../services/marketingService';

interface ContentTemplate {
  id: string;
  name: string;
  type: 'email' | 'social' | 'ad' | 'blog' | 'landing';
  description: string;
  icon: React.ElementType;
  color: string;
}

interface GeneratedContent {
  id: string;
  type: string;
  content: string;
  variations: string[];
  metadata: {
    tone: string;
    wordCount: number;
    readingTime: string;
    sentiment: 'positive' | 'neutral' | 'negative';
  };
  score: number;
  timestamp: Date;
}

interface ContentPrompt {
  topic: string;
  audience: string;
  tone: string;
  platform: string;
  keywords: string[];
  length: 'short' | 'medium' | 'long';
  cta?: string;
}

interface ContentHistoryItem {
  id: string;
  type: string;
  preview: string;
  generatedAt: string;
  score: number;
}

const TEMPLATES: ContentTemplate[] = [
  { id: 'email-promo', name: 'Promotional Email', type: 'email', description: 'Sales-focused email copy', icon: Mail, color: 'bg-blue-500' },
  { id: 'email-newsletter', name: 'Newsletter', type: 'email', description: 'Engaging newsletter content', icon: FileText, color: 'bg-indigo-500' },
  { id: 'social-post', name: 'Social Post', type: 'social', description: 'Platform-optimized posts', icon: Hash, color: 'bg-pink-500' },
  { id: 'social-story', name: 'Story/Reel Script', type: 'social', description: 'Short-form video scripts', icon: Video, color: 'bg-purple-500' },
  { id: 'social-image', name: 'Image Caption', type: 'social', description: 'Engaging image captions', icon: Image, color: 'bg-cyan-500' },
  { id: 'ad-headline', name: 'Ad Headlines', type: 'ad', description: 'High-converting ad copy', icon: Target, color: 'bg-orange-500' },
  { id: 'ad-description', name: 'Ad Descriptions', type: 'ad', description: 'Compelling ad descriptions', icon: MessageSquare, color: 'bg-red-500' },
  { id: 'blog-outline', name: 'Blog Outline', type: 'blog', description: 'SEO-optimized blog structure', icon: BookOpen, color: 'bg-green-500' },
  { id: 'landing-hero', name: 'Landing Page Hero', type: 'landing', description: 'Above-fold content', icon: Globe, color: 'bg-teal-500' },
];

const TONES = ['Professional', 'Casual', 'Friendly', 'Urgent', 'Inspirational', 'Humorous', 'Educational', 'Persuasive'];
const PLATFORMS = ['LinkedIn', 'Twitter/X', 'Instagram', 'Facebook', 'Email', 'Website', 'Google Ads', 'Meta Ads'];
const AUDIENCES = ['B2B Professionals', 'B2C Consumers', 'Small Business Owners', 'Enterprise', 'Millennials', 'Gen Z', 'Parents', 'Tech Enthusiasts'];

export const AIContentStudio: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [activeTemplate, setActiveTemplate] = useState<ContentTemplate | null>(null);
  const [generatedContents, setGeneratedContents] = useState<GeneratedContent[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [credits, setCredits] = useState(1247);
  const [recentGenerations, setRecentGenerations] = useState<ContentHistoryItem[]>([]);

  const [prompt, setPrompt] = useState<ContentPrompt>({
    topic: '',
    audience: 'B2B Professionals',
    tone: 'Professional',
    platform: 'LinkedIn',
    keywords: [],
    length: 'medium',
    cta: '',
  });

  const [keywordInput, setKeywordInput] = useState('');

  const fetchHistory = useCallback(async () => {
    try {
      const history = await marketingService.getContentHistory();
      setRecentGenerations(history);
    } catch (error) {
      console.error('Error fetching content history:', error);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleGenerate = async () => {
    if (!prompt.topic.trim()) return;
    
    setLoading(true);
    
    try {
      const result = await marketingService.generateContent(
        JSON.stringify({
          type: activeTemplate?.type || 'general',
          topic: prompt.topic,
          audience: prompt.audience,
          tone: prompt.tone,
          platform: prompt.platform,
          keywords: prompt.keywords,
          length: prompt.length,
          cta: prompt.cta,
        }),
        prompt
      );
      
      const newContent: GeneratedContent = {
        id: Date.now().toString(),
        type: activeTemplate?.name || 'General',
        content: typeof result === 'string' ? result : result,
        variations: [],
        metadata: {
          tone: prompt.tone,
          wordCount: (typeof result === 'string' ? result : '').split(' ').length,
          readingTime: `${Math.ceil((typeof result === 'string' ? result : '').split(' ').length / 200)} min`,
          sentiment: 'positive',
        },
        score: 85,
        timestamp: new Date(),
      };
      
      setGeneratedContents([newContent, ...generatedContents]);
      setCredits(prev => Math.max(0, prev - 10));
      fetchHistory();
    } catch (error) {
      console.error('Error generating content:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const addKeyword = () => {
    if (keywordInput.trim() && !prompt.keywords.includes(keywordInput.trim())) {
      setPrompt({ ...prompt, keywords: [...prompt.keywords, keywordInput.trim()] });
      setKeywordInput('');
    }
  };

  const removeKeyword = (keyword: string) => {
    setPrompt({ ...prompt, keywords: prompt.keywords.filter(k => k !== keyword) });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-7 h-7 text-yellow-500" />
            AI Content Studio
          </h1>
          <p className="text-gray-500 mt-1">Generate high-converting marketing content with AI</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-500 flex items-center gap-1">
            <Zap className="w-4 h-4 text-yellow-500" />
            <span>{credits.toLocaleString()} credits remaining</span>
          </div>
          <button
            onClick={fetchHistory}
            className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50"
            title="Refresh"
          >
            <RefreshCw className="w-5 h-5 text-gray-500" />
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50"
          >
            <Settings className="w-5 h-5 text-gray-500" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Content Generator Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Template Selection */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6"
          >
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Choose Content Type</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  onClick={() => setActiveTemplate(template)}
                  className={cn(
                    "p-3 rounded-xl border-2 transition-all text-left",
                    activeTemplate?.id === template.id
                      ? "border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                  )}
                >
                  <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center mb-2", template.color)}>
                    <template.icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">{template.name}</div>
                  <div className="text-xs text-gray-500 mt-1">{template.description}</div>
                </button>
              ))}
            </div>
          </motion.div>

          {/* Input Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6"
          >
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Content Details</h2>
            
            <div className="space-y-4">
              {/* Topic */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Topic / Subject *</label>
                <input
                  type="text"
                  value={prompt.topic}
                  onChange={(e) => setPrompt({ ...prompt, topic: e.target.value })}
                  placeholder="e.g., Product launch announcement, Holiday sale, Feature update..."
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
              </div>

              {/* Row: Audience & Tone */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Target Audience</label>
                  <select
                    value={prompt.audience}
                    onChange={(e) => setPrompt({ ...prompt, audience: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  >
                    {AUDIENCES.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tone of Voice</label>
                  <select
                    value={prompt.tone}
                    onChange={(e) => setPrompt({ ...prompt, tone: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  >
                    {TONES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              {/* Row: Platform & Length */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Platform</label>
                  <select
                    value={prompt.platform}
                    onChange={(e) => setPrompt({ ...prompt, platform: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  >
                    {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Content Length</label>
                  <div className="flex gap-2">
                    {(['short', 'medium', 'long'] as const).map((len) => (
                      <button
                        key={len}
                        onClick={() => setPrompt({ ...prompt, length: len })}
                        className={cn(
                          "flex-1 py-2 rounded-lg text-sm font-medium transition-colors capitalize",
                          prompt.length === len
                            ? "bg-yellow-500 text-white"
                            : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200"
                        )}
                      >
                        {len}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Keywords */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Keywords (optional)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addKeyword()}
                    placeholder="Add keyword and press Enter"
                    className="flex-1 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  />
                  <button onClick={addKeyword} className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200">
                    Add
                  </button>
                </div>
                {prompt.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {prompt.keywords.map(kw => (
                      <span
                        key={kw}
                        className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-full text-sm flex items-center gap-1"
                      >
                        {kw}
                        <button onClick={() => removeKeyword(kw)} className="hover:text-yellow-900">×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* CTA */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Call to Action (optional)</label>
                <input
                  type="text"
                  value={prompt.cta}
                  onChange={(e) => setPrompt({ ...prompt, cta: e.target.value })}
                  placeholder="e.g., Sign up now, Learn more, Get started free..."
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                />
              </div>

              {/* Generate Button */}
              <button
                onClick={handleGenerate}
                disabled={loading || !prompt.topic.trim()}
                className={cn(
                  "w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all",
                  loading || !prompt.topic.trim()
                    ? "bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-yellow-500 to-orange-500 text-white hover:from-yellow-600 hover:to-orange-600 shadow-lg hover:shadow-xl"
                )}
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-5 h-5" />
                    Generate Content
                  </>
                )}
              </button>
            </div>
          </motion.div>

          {/* Generated Content */}
          <AnimatePresence>
            {generatedContents.map((content, idx) => (
              <motion.div
                key={content.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded text-xs font-medium">
                        {content.type}
                      </span>
                      <span className="text-xs text-gray-500">{content.metadata.wordCount} words • {content.metadata.readingTime} read</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-green-600">Score: {content.score}/100</span>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-4 font-mono text-sm whitespace-pre-wrap text-gray-800 dark:text-gray-200">
                  {content.content}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500">
                      <ThumbsUp className="w-4 h-4" />
                    </button>
                    <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500">
                      <ThumbsDown className="w-4 h-4" />
                    </button>
                    <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500">
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                  <button
                    onClick={() => handleCopy(content.id, content.content)}
                    className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center gap-2 hover:bg-gray-200 transition-colors"
                  >
                    {copiedId === content.id ? (
                      <>
                        <Check className="w-4 h-4 text-green-500" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy
                      </>
                    )}
                  </button>
                </div>

                {/* Variations */}
                {content.variations.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Alternative Variations</h4>
                    <div className="space-y-2">
                      {content.variations.map((variation, vIdx) => (
                        <div
                          key={vIdx}
                          className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg text-sm text-gray-600 dark:text-gray-400 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                          {variation.substring(0, 150)}...
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Tips */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800 p-5"
          >
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-3">
              <Lightbulb className="w-5 h-5 text-yellow-500" />
              Quick Tips
            </h3>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                Be specific with your topic for better results
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                Add keywords to improve SEO relevance
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                Try different tones to find what resonates
              </li>
            </ul>
          </motion.div>

          {/* Recent Generations */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5"
          >
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-gray-400" />
              Recent Activity
            </h3>
            <div className="space-y-3">
              {recentGenerations.map((gen, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <div>
                    <div className="font-medium text-gray-700 dark:text-gray-300">{gen.type}</div>
                    <div className="text-xs text-gray-500">{new Date(gen.generatedAt).toLocaleString()}</div>
                  </div>
                  <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs font-medium">
                    Score: {gen.score}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AIContentStudio;
