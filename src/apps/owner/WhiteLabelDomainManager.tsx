import React, { useState } from 'react';
import { Card, Button, Heading3, Text, Icon, Badge } from '../../components/shared/ui/CommonUI';

interface CustomDomain {
    id: string;
    domain: string;
    status: 'pending' | 'verified' | 'error';
    sslStatus: 'active' | 'issuing' | 'none';
    lastVerified?: string;
}

export const WhiteLabelDomainManager: React.FC = () => {
    const [domains, setDomains] = useState<CustomDomain[]>([
        { id: '1', domain: 'portal.northstar.edu', status: 'verified', sslStatus: 'active', lastVerified: '2 hours ago' },
        { id: '2', domain: 'academy.northstar.edu', status: 'pending', sslStatus: 'none' }
    ]);
    const [newDomain, setNewDomain] = useState('');

    const handleAddDomain = () => {
        if (!newDomain) return;
        const domain: CustomDomain = {
            id: Date.now().toString(),
            domain: newDomain,
            status: 'pending',
            sslStatus: 'none'
        };
        setDomains([...domains, domain]);
        setNewDomain('');
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div>
                <h1 className="text-3xl font-black text-gray-900 dark:text-white">Custom Domains & SSL</h1>
                <Text variant="muted">Manage your custom branding on the infrastructure level.</Text>
            </div>

            <Card className="p-6">
                <Heading3 className="mb-4">Add Custom Domain</Heading3>
                <div className="flex gap-3">
                    <input
                        type="text"
                        placeholder="e.g. portal.yourschool.com"
                        value={newDomain}
                        onChange={(e) => setNewDomain(e.target.value)}
                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                    />
                    <Button variant="primary" onClick={handleAddDomain}>
                        <Icon name="PlusIcon" className="w-5 h-5 mr-2" />
                        Add Domain
                    </Button>
                </div>
                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800/50">
                    <div className="flex gap-3">
                        <Icon name="InformationCircleIcon" className="w-5 h-5 text-blue-600 mt-0.5" />
                        <div className="text-sm">
                            <p className="font-bold text-blue-900 dark:text-blue-100">Setup Instructions</p>
                            <p className="text-blue-700 dark:text-blue-300 mt-1">
                                Point your domain's CNAME record to <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">ingress.growyourneed.com</code>.
                                Propagation may take up to 24 hours.
                            </p>
                        </div>
                    </div>
                </div>
            </Card>

            <div className="grid grid-cols-1 gap-4">
                {domains.map(domain => (
                    <Card key={domain.id} className="p-5 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${domain.status === 'verified' ? 'bg-green-100 dark:bg-green-900/20' : 'bg-gray-100 dark:bg-gray-800'
                                }`}>
                                <Icon
                                    name="GlobeAltIcon"
                                    className={`w-6 h-6 ${domain.status === 'verified' ? 'text-green-600' : 'text-gray-400'}`}
                                />
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-900 dark:text-white">{domain.domain}</h4>
                                <div className="flex gap-2 mt-1">
                                    <Badge variant={domain.status === 'verified' ? 'success' : 'secondary'}>
                                        {domain.status === 'verified' ? 'Verified' : 'Pending Verification'}
                                    </Badge>
                                    <Badge variant={domain.sslStatus === 'active' ? 'success' : 'secondary'}>
                                        <Icon name="LockClosedIcon" className="w-3 h-3 mr-1" />
                                        {domain.sslStatus === 'active' ? 'SSL Active' : 'SSL Issuing'}
                                    </Badge>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                                <Icon name="ArrowPathIcon" className="w-4 h-4 mr-2" />
                                Re-verify
                            </Button>
                            <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-50 hover:text-red-600">
                                <Icon name="TrashIcon" className="w-4 h-4" />
                            </Button>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
};
