import React, { useState } from 'react';
import { WidgetErrorBoundary } from '../../components/shared/ui/WidgetErrorBoundary';
import { Heading1, Text } from '../../components/shared/ui/Typography';
import { Card } from '../../components/shared/ui/Card';
import { Tabs } from '../../components/shared/ui/Tabs';
import { StudentDirectory } from './people/StudentDirectory';
import { TeacherDirectory } from './people/TeacherDirectory';
import { ParentDirectory } from './people/ParentDirectory';
import { StaffDirectory } from './people/StaffDirectory';

interface PeopleProps {
    activeTab?: string;
    activeSubNav?: string;
}

const People: React.FC<PeopleProps> = ({ activeTab: initialTab }) => {
    const [activeTab, setActiveTab] = useState(initialTab || 'Students');

    const renderContent = () => {
        switch (activeTab) {
            case 'Students':
                return <StudentDirectory />;
            case 'Teachers':
                return <TeacherDirectory />;
            case 'Parents':
                return <ParentDirectory />;
            case 'Staff':
                return <StaffDirectory />;
            default:
                return <StudentDirectory />;
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-fadeIn">
            <div className="flex justify-between items-end">
                <div>
                    <Heading1>People Management</Heading1>
                    <Text variant="muted">Manage students, teachers, staff, and parents.</Text>
                </div>
            </div>

            <Card className="min-h-[600px]" padding="none">
                <div className="p-6 border-b border-gray-100 dark:border-slate-700">
                    <Tabs 
                        tabs={['Students', 'Teachers', 'Parents', 'Staff']} 
                        activeTab={activeTab} 
                        onTabChange={setActiveTab} 
                    />
                </div>

                <div className="p-6">
                    {renderContent()}
                </div>
            </Card>
        </div>
    );
};

export default People;
