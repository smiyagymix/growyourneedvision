import React, { useState } from 'react';
import { MultiverseMap } from './edumultiverse/screens/MultiverseMap';
import { ParallelClassrooms } from './edumultiverse/screens/ParallelClassrooms';
import { GlitchHunter } from './edumultiverse/screens/GlitchHunter';
import { TimeLoopMission } from './edumultiverse/screens/TimeLoopMission';
import { ConceptFusion } from './edumultiverse/screens/ConceptFusion';
import { QuantumQuiz } from './edumultiverse/screens/QuantumQuiz';
import { Leaderboard } from './edumultiverse/components/Leaderboard';
import { Mission } from './edumultiverse/types/gamification';

interface EduMultiverseAppProps {
    activeTab: string;
    activeSubNav: string;
    onNavigate?: (tab: string, subNav?: string, state?: any) => void;
}

const EduMultiverseApp: React.FC<EduMultiverseAppProps> = ({ activeTab, activeSubNav, onNavigate }) => {
    const [selectedUniverseId, setSelectedUniverseId] = useState<string | null>(null);
    const [selectedMission, setSelectedMission] = useState<Mission | null>(null);

    const handleInternalNavigate = (tab: string, subNav?: string, state?: any) => {
        if (state?.mission) {
            setSelectedMission(state.mission);
        }
        if (onNavigate) {
            onNavigate(tab, subNav);
        }
    };

    // Map tabs and subnavs to screens
    const renderContent = () => {
        if (selectedUniverseId && activeTab === 'Map') {
            return (
                <ParallelClassrooms 
                    universeId={selectedUniverseId} 
                    onBack={() => setSelectedUniverseId(null)} 
                    onNavigate={handleInternalNavigate}
                />
            );
        }

        switch (activeTab) {
            case 'Map':
                return (
                    <MultiverseMap 
                        onSelectUniverse={(id) => setSelectedUniverseId(id)} 
                        onNavigate={handleInternalNavigate} 
                    />
                );
            case 'Fusion Lab':
                return <ConceptFusion />;
            case 'Glitches':
                return <GlitchHunter />;
            case 'Quiz':
                return <QuantumQuiz />;
            case 'Time Loop':
                return (
                    <TimeLoopMission 
                        mission={selectedMission || undefined} 
                        onBack={() => onNavigate?.('Map')} 
                    />
                );
            case 'Leaderboard':
                return <Leaderboard />;
            default:
                return (
                    <MultiverseMap 
                        onSelectUniverse={(id) => setSelectedUniverseId(id)} 
                        onNavigate={handleInternalNavigate}
                    />
                );
        }
    };

    return (
        <div className="h-full w-full bg-slate-950 text-white overflow-auto rounded-xl">
            {renderContent()}
        </div>
    );
};

export default EduMultiverseApp;
