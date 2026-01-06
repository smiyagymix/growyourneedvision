import React from 'react';
import { EditorProvider } from './store/editorStore';
import { Toolbar } from './components/Toolbar/Toolbar';
import { PropertiesPanel } from './components/Panels/PropertiesPanel';
import { LayersPanel } from './components/Panels/LayersPanel';
import { AssetsPanel } from './components/Panels/AssetsPanel';
import { Canvas } from './components/Canvas/Canvas';
import { OwnerIcon } from '../../components/shared/OwnerIcons';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useAutoSave } from './hooks/useAutoSave';

const EditorLayout: React.FC = () => {
    const [activeLeftPanel, setActiveLeftPanel] = React.useState<'layers' | 'assets'>('assets');

    return (
        <div className="flex h-full w-full bg-[#18181b] overflow-hidden">
            {/* Main Toolbar */}
            <Toolbar />

            {/* Left Panel (Collapsible/Switchable) */}
            <div className="w-64 bg-[#1f1f22] border-r border-[#27272a] flex flex-col z-10 shadow-lg">
                {/* Panel Tabs */}
                <div className="flex border-b border-[#27272a]">
                    <button
                        type="button"
                        onClick={() => setActiveLeftPanel('assets')}
                        className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors ${activeLeftPanel === 'assets' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-gray-500 hover:text-white'}`}
                    >
                        Assets
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveLeftPanel('layers')}
                        className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors ${activeLeftPanel === 'layers' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-gray-500 hover:text-white'}`}
                    >
                        Layers
                    </button>
                </div>

                {/* Panel Content */}
                <div className="flex-1 overflow-hidden">
                    {activeLeftPanel === 'assets' ? <AssetsPanel /> : <LayersPanel />}
                </div>
            </div>

            {/* Canvas Area */}
            <Canvas />

            {/* Right Panel (Properties) */}
            <PropertiesPanel />
        </div>
    );
};

export const DesignEditor: React.FC = () => {
    useKeyboardShortcuts();
    useAutoSave();

    return (
        <EditorProvider>
            <EditorLayout />
        </EditorProvider>
    );
};

export default DesignEditor;
