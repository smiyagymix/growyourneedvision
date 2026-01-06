import React from 'react';
import { Card } from '../../components/shared/ui/CommonUI';
import { AssetLibrary } from '../../components/marketing/AssetLibrary';
import { EmailTemplateManager } from '../../components/marketing/EmailTemplateManager';
import { AudienceManager } from '../../components/marketing/AudienceManager';
import { AICampaignGenerator } from '../../components/marketing/AICampaignGenerator';
import { JourneyBuilder } from '../../components/marketing/JourneyBuilder';
import { PersonalizationEngine } from '../../components/marketing/PersonalizationEngine';
import { ABTesting } from '../../components/marketing/ABTesting';
import { CDP } from '../../components/marketing/CDP';
import { PredictiveScoring } from '../../components/marketing/PredictiveScoring';
import { SocialScheduler } from '../../components/marketing/SocialScheduler';
import { CreativeStudio } from '../../components/marketing/CreativeStudio';
import { AttributionAnalyzer } from '../../components/marketing/AttributionAnalyzer';
import { ExperimentationLab } from '../../components/marketing/ExperimentationLab';
import { CampaignsDashboard } from '../../components/marketing/CampaignsDashboard';

interface MarketingDashboardProps {
    activeSubNav?: string;
}

export const MarketingDashboard: React.FC<MarketingDashboardProps> = ({ activeSubNav = 'Campaigns' }) => {
    const renderContent = () => {
        switch (activeSubNav) {
            case 'Campaigns': return <CampaignsDashboard />;
            case 'Assets': return <Card className="p-4"><AssetLibrary /></Card>;
            case 'Templates': return <EmailTemplateManager />;
            case 'Audience': return <AudienceManager />;
            case 'AI Generator': return <AICampaignGenerator />;
            case 'Journey Builder': return <JourneyBuilder />;
            case 'Personalization': return <PersonalizationEngine />;
            case 'A/B Testing': return <ABTesting />;
            case 'CDP': return <CDP />;
            case 'Scoring': return <PredictiveScoring />;
            case 'Social Scheduler': return <SocialScheduler />;
            case 'Creative Studio': return <CreativeStudio />;
            case 'Attribution': return <AttributionAnalyzer />;
            case 'Experiments': return <ExperimentationLab />;
            default: return <CampaignsDashboard />;
        }
    };

    return (
        <div className="space-y-2 animate-fadeIn">
            {renderContent()}
        </div>
    );
};
