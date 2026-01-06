import React, { useState } from 'react';
import { Modal, Button, Icon } from '../ui/CommonUI';
import { aiService } from '../../../services/aiService';
import { sanitizeText, sanitizeHtml } from '../../../utils/sanitization';
import { useRateLimit, RateLimitPresets } from '../../../hooks/useRateLimit';

interface AIContentGeneratorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (content: string) => void;
    title: string;
    promptTemplate: string;
    contextData?: Record<string, unknown>;
    placeholder?: string;
}

export const AIContentGeneratorModal: React.FC<AIContentGeneratorModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    title,
    promptTemplate,
    contextData,
    placeholder
}) => {
    const [isLoading, setIsLoading] = useState(false);
    const [generatedContent, setGeneratedContent] = useState('');
    const [customInstruction, setCustomInstruction] = useState('');
    const { executeIfAllowed } = useRateLimit(RateLimitPresets.AI_GENERATE);

    const handleGenerate = async () => {
        await executeIfAllowed(async () => {
            setIsLoading(true);
            setGeneratedContent('');

        try {
            // Sanitize inputs to prevent prompt injection
            const sanitizedInstruction = sanitizeText(customInstruction);
            const fullPrompt = `${promptTemplate}\n\nAdditional Instructions:\n${sanitizedInstruction}`;
            const response = await aiService.generateContent({
                prompt: fullPrompt,
                context: contextData
            });
            // Sanitize AI-generated content for safe display
            const sanitizedContent = sanitizeHtml(response.content, 'RICH');
            setGeneratedContent(sanitizedContent);
        } catch (error) {
            console.error("AI Generation failed:", error);
            setGeneratedContent("Failed to generate content. Please try again.");
        } finally {
            setIsLoading(false);
        }
        });
    };

    // Removed useEffect watching messages as we now await the response directly

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title} size="lg">
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
                        Custom Instructions (Optional)
                    </label>
                    <textarea
                        className="w-full p-3 border rounded-xl dark:bg-slate-800 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        rows={3}
                        placeholder={placeholder || "E.g., Focus on practical examples, make it difficult, etc."}
                        value={customInstruction}
                        onChange={(e) => setCustomInstruction(e.target.value)}
                    />
                </div>

                {generatedContent && (
                    <div className="bg-gray-50 dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-700 max-h-60 overflow-y-auto">
                        <h4 className="text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-2">
                            <Icon name="Sparkles" className="w-4 h-4 text-purple-500" />
                            AI Output
                        </h4>
                        <div className="prose dark:prose-invert text-sm whitespace-pre-wrap">
                            {generatedContent}
                        </div>
                    </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-slate-700">
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>
                    {generatedContent ? (
                        <>
                            <Button variant="secondary" onClick={handleGenerate} disabled={isLoading}>
                                {isLoading ? 'Regenerating...' : 'Regenerate'}
                            </Button>
                            <Button variant="primary" onClick={() => onSuccess(generatedContent)}>
                                Use Content
                            </Button>
                        </>
                    ) : (
                        <Button
                            variant="primary"
                            onClick={handleGenerate}
                            disabled={isLoading}
                            leftIcon={isLoading ? <Icon name="ArrowPathIcon" className="w-4 h-4 animate-spin" /> : <Icon name="Sparkles" className="w-4 h-4" />}
                            className="bg-gradient-to-r from-purple-600 to-blue-600 border-none"
                        >
                            {isLoading ? 'Generating...' : 'Generate with AI'}
                        </Button>
                    )}
                </div>
            </div>
        </Modal>
    );
};
