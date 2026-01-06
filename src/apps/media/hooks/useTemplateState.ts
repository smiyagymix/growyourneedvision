import { useState, useCallback } from 'react';
import { TemplateType } from '../templates/types';

interface TemplateState {
    templateType: TemplateType;
    // Content
    title: string;
    subtitle: string;
    // Styling
    primaryColor: string;
    backgroundColor: string;
    // Educational
    lessonNumber: string;
    subject: string;
    // Corporate
    companyName: string;
    tagline: string;
    // Minimal
    accentPosition: 'top' | 'bottom' | 'center';
}

interface UseTemplateStateReturn {
    state: TemplateState;
    updateState: (updates: Partial<TemplateState>) => void;
    resetState: () => void;
    switchTemplate: (templateType: TemplateType) => void;
}

const DEFAULT_STATE: TemplateState = {
    templateType: 'educational',
    title: 'Welcome',
    subtitle: 'Get Started Today',
    primaryColor: '#3b82f6',
    backgroundColor: '#0f172a',
    lessonNumber: '1',
    subject: 'Introduction',
    companyName: 'Company Name',
    tagline: 'Excellence in Innovation',
    accentPosition: 'center',
};

export const useTemplateState = (): UseTemplateStateReturn => {
    const [state, setState] = useState<TemplateState>(DEFAULT_STATE);

    const updateState = useCallback((updates: Partial<TemplateState>) => {
        setState(prev => ({ ...prev, ...updates }));
    }, []);

    const resetState = useCallback(() => {
        setState(DEFAULT_STATE);
    }, []);

    const switchTemplate = useCallback((templateType: TemplateType) => {
        setState(prev => ({ ...prev, templateType }));
    }, []);

    return {
        state,
        updateState,
        resetState,
        switchTemplate,
    };
};
