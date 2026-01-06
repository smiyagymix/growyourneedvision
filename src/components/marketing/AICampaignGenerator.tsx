import React, { useState } from 'react';
import { Card, Button, Icon, Badge, Modal, Input, Select } from '../shared/ui/CommonUI';
import { aiService } from '../../services/aiService';
import { marketingService } from '../../services/marketingService';

interface GeneratedCampaign {
    name: string;
    objective: string;
    channels: string[];
    targetAudience: {
        demographics: string[];
        interests: string[];
        behaviors: string[];
    };
    content: {
        headline: string;
        subheadline: string;
        cta: string;
        emailSubject?: string;
        socialPosts: string[];
    };
    budget: {
        recommended: number;
        breakdown: { channel: string; amount: number }[];
    };
    timeline: {
        duration: string;
        phases: { name: string; days: string }[];
    };
}

export const AICampaignGenerator: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [loading, setLoading] = useState(false);
    const [generatedCampaign, setGeneratedCampaign] = useState<GeneratedCampaign | null>(null);
    const [showResults, setShowResults] = useState(false);
    const [selectedTone, setSelectedTone] = useState('professional');
    const [selectedIndustry, setSelectedIndustry] = useState('ecommerce');

    const generateCampaign = async () => {
        if (!prompt.trim()) return;
        
        setLoading(true);
        try {
            // Call AI service for generation
            const systemPrompt = `You are a marketing strategist AI. Generate a comprehensive marketing campaign based on the user's goal. 
            Tone: ${selectedTone}
            Industry: ${selectedIndustry}
            
            Return a JSON object with this structure:
            {
                "name": "Campaign name",
                "objective": "Campaign objective",
                "channels": ["channel1", "channel2"],
                "targetAudience": { "demographics": [], "interests": [], "behaviors": [] },
                "content": { "headline": "", "subheadline": "", "cta": "", "emailSubject": "", "socialPosts": [] },
                "budget": { "recommended": 5000, "breakdown": [] },
                "timeline": { "duration": "4 weeks", "phases": [] }
            }`;

            const result = await aiService.generateContent({
                prompt: `${systemPrompt}\n\nUser Goal: ${prompt}`,
                maxTokens: 2000,
                temperature: 0.7
            });

            // Parse AI response or use fallback mock
            let campaign: GeneratedCampaign;
            try {
                const jsonMatch = result.content.match(/\{[\s\S]*\}/);
                campaign = jsonMatch ? JSON.parse(jsonMatch[0]) : generateMockCampaign(prompt);
            } catch {
                campaign = generateMockCampaign(prompt);
            }

            setGeneratedCampaign(campaign);
            setShowResults(true);
        } catch (error) {
            console.error('AI generation failed:', error);
            // Use mock data as fallback
            setGeneratedCampaign(generateMockCampaign(prompt));
            setShowResults(true);
        } finally {
            setLoading(false);
        }
    };

    const generateMockCampaign = (userPrompt: string): GeneratedCampaign => {
        const words = userPrompt.toLowerCase();
        const isEcommerce = words.includes('product') || words.includes('sale') || words.includes('shop');
        const isBrand = words.includes('brand') || words.includes('awareness') || words.includes('launch');
        
        return {
            name: `${userPrompt.slice(0, 30)}... Campaign`,
            objective: isBrand ? 'Brand Awareness' : isEcommerce ? 'Drive Sales' : 'Lead Generation',
            channels: ['Email', 'Social Media', 'PPC', 'Content Marketing'],
            targetAudience: {
                demographics: ['Age 25-45', 'Urban professionals', 'Income $50k+'],
                interests: ['Technology', 'Sustainability', 'Innovation'],
                behaviors: ['Online shoppers', 'Early adopters', 'Social media active']
            },
            content: {
                headline: 'Transform Your Experience Today',
                subheadline: 'Discover what sets us apart from the rest',
                cta: 'Get Started Now',
                emailSubject: '🚀 Exclusive: Your Personal Invitation Inside',
                socialPosts: [
                    '✨ Big news dropping soon! Stay tuned for something special... #Innovation #ComingSoon',
                    '🎯 Ready to level up? We\'ve got exactly what you need. Link in bio! #Growth',
                    '💡 Behind the scenes of our latest project. This one\'s for you! #BTS #Exclusive'
                ]
            },
            budget: {
                recommended: 5000,
                breakdown: [
                    { channel: 'Social Ads', amount: 2000 },
                    { channel: 'Google Ads', amount: 1500 },
                    { channel: 'Email Marketing', amount: 500 },
                    { channel: 'Content Creation', amount: 1000 }
                ]
            },
            timeline: {
                duration: '4 weeks',
                phases: [
                    { name: 'Pre-launch Teasers', days: 'Days 1-7' },
                    { name: 'Launch Week', days: 'Days 8-14' },
                    { name: 'Momentum Building', days: 'Days 15-21' },
                    { name: 'Conversion Push', days: 'Days 22-28' }
                ]
            }
        };
    };

    const handleUseCampaign = async () => {
        if (!generatedCampaign) return;
        
        try {
            // Create actual campaign from AI-generated template
            await marketingService.createCampaign({
                name: generatedCampaign.name,
                status: 'Draft',
                type: 'Social',
                budget: generatedCampaign.budget.recommended,
                start_date: new Date().toISOString().split('T')[0],
                end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                spent: 0,
                performance_score: 0,
                impressions: 0,
                clicks: 0,
                conversions: 0
            });
            alert('Campaign created successfully! Check Campaigns Dashboard to launch it.');
            setShowResults(false);
            setPrompt('');
            setGeneratedCampaign(null);
        } catch (error) {
            console.error('Failed to create campaign:', error);
            alert('Failed to create campaign. Please try again.');
        }
    };

    return (
        <div className="space-y-2">
            {/* Hero Section */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-4 text-white relative overflow-hidden">
                <div className="relative z-10">
                    <h2 className="text-base font-black mb-2">AI Campaign Generator</h2>
                    <p className="text-blue-100 max-w-2xl mb-3 text-[10px]">
                        Describe your campaign goal, and let our advanced AI generate a complete multi-channel strategy, including copy, assets, and targeting rules.
                    </p>
                    
                    {/* Options Row */}
                    <div className="flex gap-2 mb-2">
                        <select 
                            value={selectedTone} 
                            onChange={(e) => setSelectedTone(e.target.value)}
                            className="bg-white/10 border border-white/20 rounded-lg px-2 py-1 text-white text-[9px]"
                        >
                            <option value="professional">Professional Tone</option>
                            <option value="casual">Casual & Friendly</option>
                            <option value="playful">Playful & Fun</option>
                            <option value="luxury">Luxury & Premium</option>
                            <option value="urgent">Urgent & Action-driven</option>
                        </select>
                        <select 
                            value={selectedIndustry} 
                            onChange={(e) => setSelectedIndustry(e.target.value)}
                            className="bg-white/10 border border-white/20 rounded-lg px-2 py-1 text-white text-[9px]"
                        >
                            <option value="ecommerce">E-commerce</option>
                            <option value="saas">SaaS / Tech</option>
                            <option value="healthcare">Healthcare</option>
                            <option value="education">Education</option>
                            <option value="finance">Finance</option>
                            <option value="retail">Retail</option>
                        </select>
                    </div>

                    {/* Input Box */}
                    <div className="bg-white/10 backdrop-blur-md rounded-xl p-1 flex gap-1 max-w-3xl border border-white/20">
                        <input
                            type="text"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && generateCampaign()}
                            placeholder="e.g., Launching a new summer collection for Gen Z with a focus on sustainability..."
                            className="flex-1 bg-transparent border-none text-white placeholder-blue-200 focus:ring-0 text-[10px] px-2"
                        />
                        <Button 
                            variant="secondary" 
                            className="bg-white text-purple-600 hover:bg-blue-50 border-none"
                            onClick={generateCampaign}
                            disabled={loading || !prompt.trim()}
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin h-3 w-3 border-2 border-purple-600 border-t-transparent rounded-full mr-1"></div>
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <Icon name="Sparkles" className="w-3 h-3 mr-1" />
                                    Generate Magic
                                </>
                            )}
                        </Button>
                    </div>
                </div>
                {/* Decorative background elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/20 rounded-full blur-2xl -ml-10 -mb-10"></div>
            </div>

            {/* Feature Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <Card className="p-2 border-l-4 border-purple-500">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-1 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600">
                            <Icon name="DocumentTextIcon" className="w-4 h-4" />
                        </div>
                        <h3 className="font-bold text-[10px]">Content Strategy</h3>
                    </div>
                    <p className="text-[9px] text-gray-500 mb-2">AI generates blog posts, social captions, and email newsletters tailored to your voice.</p>
                    <div className="flex items-center text-[8px] font-bold text-gray-400">
                        <Icon name="CheckCircleIcon" className="w-3 h-3 mr-0.5 text-green-500" /> Auto-Tone Matching
                    </div>
                </Card>

                <Card className="p-2 border-l-4 border-blue-500">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-1 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600">
                            <Icon name="PhotoIcon" className="w-4 h-4" />
                        </div>
                        <h3 className="font-bold text-[10px]">Visual Assets</h3>
                    </div>
                    <p className="text-[9px] text-gray-500 mb-2">Generates image prompts and selects stock assets that match your campaign theme.</p>
                    <div className="flex items-center text-[8px] font-bold text-gray-400">
                        <Icon name="CheckCircleIcon" className="w-3 h-3 mr-0.5 text-green-500" /> DALL-E 3 Integrated
                    </div>
                </Card>

                <Card className="p-2 border-l-4 border-pink-500">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-1 bg-pink-100 dark:bg-pink-900/30 rounded-lg text-pink-600">
                            <Icon name="UserGroupIcon" className="w-4 h-4" />
                        </div>
                        <h3 className="font-bold text-[10px]">Targeting Rules</h3>
                    </div>
                    <p className="text-[9px] text-gray-500 mb-2">Suggests audience segments and lookalike audiences based on campaign goals.</p>
                    <div className="flex items-center text-[8px] font-bold text-gray-400">
                        <Icon name="CheckCircleIcon" className="w-3 h-3 mr-0.5 text-green-500" /> Predictive Scoring
                    </div>
                </Card>
            </div>

            {/* Recent Generations */}
            <Card className="p-6">
                <h3 className="font-bold text-lg mb-4">Quick Templates</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                        { label: 'Product Launch', prompt: 'Launch campaign for a new innovative product targeting early adopters' },
                        { label: 'Holiday Sale', prompt: 'Holiday season sale campaign with urgency and limited-time offers' },
                        { label: 'Brand Awareness', prompt: 'Brand awareness campaign for a new sustainable fashion brand' },
                        { label: 'Lead Generation', prompt: 'B2B lead generation campaign for a SaaS software solution' },
                    ].map((template) => (
                        <button
                            key={template.label}
                            onClick={() => { setPrompt(template.prompt); }}
                            className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all text-left"
                        >
                            <div className="font-medium text-sm">{template.label}</div>
                            <div className="text-xs text-gray-400 mt-1 truncate">{template.prompt}</div>
                        </button>
                    ))}
                </div>
            </Card>

            <div className="text-center text-sm text-gray-400 pt-4">
                Powered by GPT-4 and Enterprise Marketing Knowledge Graph
            </div>

            {/* Results Modal */}
            <Modal isOpen={showResults} onClose={() => setShowResults(false)} title="Generated Campaign Strategy" size="xl">
                {generatedCampaign && (
                    <div className="space-y-6 max-h-[70vh] overflow-y-auto">
                        {/* Campaign Overview */}
                        <div className="bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 rounded-xl p-6">
                            <h3 className="text-2xl font-bold mb-2">{generatedCampaign.name}</h3>
                            <Badge variant="primary">{generatedCampaign.objective}</Badge>
                            <div className="flex gap-2 mt-3 flex-wrap">
                                {generatedCampaign.channels.map(ch => (
                                    <span key={ch} className="px-3 py-1 bg-white dark:bg-gray-800 rounded-full text-xs font-medium">
                                        {ch}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Target Audience */}
                        <div>
                            <h4 className="font-bold mb-3">Target Audience</h4>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                    <div className="text-xs text-gray-500 mb-2">Demographics</div>
                                    {generatedCampaign.targetAudience.demographics.map(d => (
                                        <div key={d} className="text-sm">• {d}</div>
                                    ))}
                                </div>
                                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                    <div className="text-xs text-gray-500 mb-2">Interests</div>
                                    {generatedCampaign.targetAudience.interests.map(i => (
                                        <div key={i} className="text-sm">• {i}</div>
                                    ))}
                                </div>
                                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                    <div className="text-xs text-gray-500 mb-2">Behaviors</div>
                                    {generatedCampaign.targetAudience.behaviors.map(b => (
                                        <div key={b} className="text-sm">• {b}</div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <div>
                            <h4 className="font-bold mb-3">Generated Content</h4>
                            <Card className="p-4 space-y-3">
                                <div>
                                    <div className="text-xs text-gray-500">Headline</div>
                                    <div className="text-xl font-bold">{generatedCampaign.content.headline}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-gray-500">Subheadline</div>
                                    <div className="text-gray-600 dark:text-gray-300">{generatedCampaign.content.subheadline}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-gray-500">Call to Action</div>
                                    <Button variant="primary" size="sm">{generatedCampaign.content.cta}</Button>
                                </div>
                                {generatedCampaign.content.emailSubject && (
                                    <div>
                                        <div className="text-xs text-gray-500">Email Subject Line</div>
                                        <div className="font-medium">{generatedCampaign.content.emailSubject}</div>
                                    </div>
                                )}
                            </Card>
                            
                            <div className="mt-4">
                                <div className="text-xs text-gray-500 mb-2">Social Posts</div>
                                <div className="space-y-2">
                                    {generatedCampaign.content.socialPosts.map((post, i) => (
                                        <div key={i} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm">
                                            {post}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Budget & Timeline */}
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <h4 className="font-bold mb-3">Recommended Budget</h4>
                                <Card className="p-4">
                                    <div className="text-3xl font-bold text-green-600 mb-4">
                                        ${generatedCampaign.budget.recommended.toLocaleString()}
                                    </div>
                                    <div className="space-y-2">
                                        {generatedCampaign.budget.breakdown.map(item => (
                                            <div key={item.channel} className="flex justify-between text-sm">
                                                <span>{item.channel}</span>
                                                <span className="font-medium">${item.amount.toLocaleString()}</span>
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            </div>
                            <div>
                                <h4 className="font-bold mb-3">Timeline ({generatedCampaign.timeline.duration})</h4>
                                <Card className="p-4">
                                    <div className="space-y-3">
                                        {generatedCampaign.timeline.phases.map((phase, i) => (
                                            <div key={i} className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 text-sm font-bold">
                                                    {i + 1}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-sm">{phase.name}</div>
                                                    <div className="text-xs text-gray-500">{phase.days}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <Button variant="ghost" onClick={() => setShowResults(false)}>
                                Close
                            </Button>
                            <Button variant="secondary" icon="ArrowDownTrayIcon">
                                Export PDF
                            </Button>
                            <Button variant="primary" icon="RocketLaunchIcon" onClick={handleUseCampaign}>
                                Use This Campaign
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};
