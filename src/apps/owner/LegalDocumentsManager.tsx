import React, { useState } from 'react';
import { WidgetErrorBoundary } from '../../components/shared/ui/WidgetErrorBoundary';
import { Card, Icon, Badge, Button } from '../../components/shared/ui/CommonUI';
import { useLegalDocuments, usePublishLegalDoc } from '../../hooks/usePhase2Data';
import { useToast } from '../../hooks/useToast';

const LegalDocumentsManager: React.FC = () => {
    const { data: documents, isLoading, error } = useLegalDocuments();
    const publishMutation = usePublishLegalDoc();
    const [selectedDoc, setSelectedDoc] = useState<any | null>(null);

    const getTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            terms: 'Terms of Service',
            privacy: 'Privacy Policy',
            gdpr: 'GDPR Compliance',
            cookie: 'Cookie Policy',
            acceptable_use: 'Acceptable Use Policy'
        };
        return labels[type] || type;
    };

    const handlePublish = async (docId: string, currentVersion: string) => {
        const [major, minor] = currentVersion.split('.').map(Number);
        const newVersion = `${major}.${minor + 1}`;

        try {
            await publishMutation.mutateAsync({ id: docId, version: newVersion });
            alert('Document published successfully!');
        } catch (error) {
            alert('Failed to publish document');
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-lg">
                <p className="text-red-800 dark:text-red-200">Failed to load legal documents. Please try again.</p>
            </div>
        );
    }


    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Legal Documents</h2>
                    <p className="text-sm text-gray-500 mt-1">Manage Terms of Service, Privacy Policy, and compliance documents</p>
                </div>
                <Button name="new-legal-document" variant="primary">
                    <Icon name="PlusIcon" className="w-4 h-4 mr-2" />
                    New Document
                </Button>
            </div>

            {/* Documents Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {documents?.map((doc) => (
                    <Card key={doc.id} className="p-6 hover:shadow-lg transition-shadow">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                                    <Icon name="DocumentTextIcon" className="w-6 h-6 text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 dark:text-white">{doc.title}</h3>
                                    <p className="text-xs text-gray-500">v{doc.version}</p>
                                </div>
                            </div>
                            <Badge variant={doc.status === 'published' ? 'success' : doc.status === 'draft' ? 'warning' : 'neutral'}>
                                {doc.status}
                            </Badge>
                        </div>

                        <div className="space-y-2 mb-4 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Type:</span>
                                <span className="font-medium">{getTypeLabel(doc.type)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Updated:</span>
                                <span className="font-medium">{new Date(doc.updated).toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">By:</span>
                                <span className="font-medium text-xs">{doc.updated_by}</span>
                            </div>
                        </div>

                        <div className="flex gap-2 pt-4 border-t">
                            <Button name="view-legal-doc" variant="outline" size="sm" className="flex-1" onClick={() => setSelectedDoc(doc)}>
                                <Icon name="EyeIcon" className="w-4 h-4 mr-1" />
                                View
                            </Button>
                            <Button name="edit-legal-doc" variant="outline" size="sm" className="flex-1">
                                <Icon name="PencilIcon" className="w-4 h-4 mr-1" />
                                Edit
                            </Button>
                            {doc.status === 'draft' && (
                                <Button
                                    name="publish-legal-doc"
                                    variant="primary"
                                    size="sm"
                                    onClick={() => handlePublish(doc.id, doc.version)}
                                    disabled={publishMutation.isPending}
                                >
                                    {publishMutation.isPending ? 'Publishing...' : 'Publish'}
                                </Button>
                            )}
                        </div>
                    </Card>
                ))}
            </div>

            {/* Version History Alert */}
            <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200">
                <div className="flex gap-3">
                    <Icon name="InformationCircleIcon" className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                        <p className="font-semibold text-blue-900 dark:text-blue-100">Version Control Enabled</p>
                        <p className="text-blue-700 dark:text-blue-200">All changes are tracked. Tenants see the latest published version automatically.</p>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default LegalDocumentsManager;
