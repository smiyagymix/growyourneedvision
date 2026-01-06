
import React, { useState } from 'react';
import { OwnerIcon } from '../components/shared/OwnerIcons';
import { DesignEditor } from './creator/DesignEditor';
import { VideoEditor } from './media/VideoEditor';
import { CodeEditor } from './creator/CodeEditor';
import { OfficeSuite } from './creator/OfficeSuite';
import { AIContentGeneratorModal } from '../components/shared/modals/AIContentGeneratorModal';

interface CreatorStudioProps {
    activeTab: string;
    activeSubNav: string;
}

const CreatorStudio: React.FC<CreatorStudioProps> = ({ activeTab, activeSubNav }) => {
    const [isAIModalOpen, setIsAIModalOpen] = useState(false);

    const renderContent = () => {
        switch (activeTab) {
            case 'Designer':
                return (
                    <div className="w-full h-full overflow-hidden flex items-center justify-center">
                        <DesignEditor />
                    </div>
                );
            case 'Video':
                return (
                    <div className="w-full h-full p-4">
                        <VideoEditor />
                    </div>
                );
            case 'Coder':
                return (
                    <div className="w-full h-full">
                        <CodeEditor />
                    </div>
                );
            case 'Office':
                return (
                    <div className="w-full h-full">
                        <OfficeSuite />
                    </div>
                );
            default:
                return (
                    <div className="w-full h-full flex items-center justify-center text-gray-500">
                        <p>Select a tool from the tabs above</p>
                    </div>
                );
        }
    };

    return (
        <div className="h-full flex flex-col bg-[#18181b] text-white overflow-hidden animate-fadeIn">
            {/* Top Menu Bar */}
            <div className="h-12 border-b border-[#27272a] bg-[#1f1f22] flex items-center justify-between px-4 shrink-0 shadow-sm z-20">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 text-purple-400 font-bold tracking-wider text-xs uppercase">
                        <OwnerIcon name="StudioIcon3D" className="w-5 h-5" />
                        <span className="font-machina">Studio - {activeTab}</span>
                    </div>
                    <div className="h-4 w-[1px] bg-[#3f3f46]"></div>

                    <div className="flex items-center space-x-1">
                        {['File', 'Edit', 'View', 'Insert', 'Format', 'Tools'].map(item => (
                            <button type="button" key={item} className="px-3 py-1.5 rounded hover:bg-[#3f3f46] text-xs text-gray-400 hover:text-white transition-colors">
                                {item}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="flex items-center space-x-3">
                    <span className="text-xs text-gray-500">Auto-saved</span>
                    <button type="button" className="bg-white text-black px-4 py-1.5 rounded-md text-xs font-bold hover:bg-gray-200 transition-colors">
                        Share
                    </button>
                    <button type="button" className="bg-purple-600 text-white px-4 py-1.5 rounded-md text-xs font-bold hover:bg-purple-500 shadow-lg shadow-purple-900/20 transition-all">
                        Export
                    </button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Main Content Area */}
                <div className="flex-1 bg-[#121214] relative flex flex-col overflow-hidden">
                    {renderContent()}
                </div>
            </div>

            <AIContentGeneratorModal
                isOpen={isAIModalOpen}
                onClose={() => setIsAIModalOpen(false)}
                onSuccess={(content) => {
                    console.log("AI Generated Content:", content);
                    setIsAIModalOpen(false);
                    // In a real app, this would apply the layout or add elements
                    alert("AI Suggestions Generated! (Check console for details)");
                }}
                title="AI Design Assistant"
                promptTemplate="Suggest 3 creative layout ideas for a [Project Type] targeting [Audience]. Include color palette suggestions (Hex codes) and typography pairings."
                contextData={{ activeTab, activeTool: 'Layout' }}
            />
        </div>
    );
};

export default CreatorStudio;