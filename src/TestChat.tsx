import React from 'react';
import { AIAssistant } from './apps/concierge_ai/AIAssistant';

const TestChat: React.FC = () => {
    return (
        <div style={{ height: '100vh', width: '100vw', padding: '20px', background: '#f0f0f0' }}>
            <h1>Debug Page</h1>
            <h2>Concierge AI</h2>
            <div style={{ height: '90vh' }}>
                <AIAssistant context="Test Chat" />
            </div>
        </div>
    );
};

export default TestChat;
