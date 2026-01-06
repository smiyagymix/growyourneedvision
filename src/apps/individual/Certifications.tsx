import React, { useState, useEffect } from 'react';
import { WidgetErrorBoundary } from '../../components/shared/ui/WidgetErrorBoundary';
import { Card, Button, Icon } from '../../components/shared/ui/CommonUI';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';
import pb from '../../lib/pocketbase';
import { motion } from 'framer-motion';
import { z } from 'zod';
import { sanitizeText } from '../../utils/sanitization';

// Certificate validation schema
const certificateSchema = z.object({
    title: z.string().min(3, 'Title must be at least 3 characters').max(200),
    issuer: z.string().min(2, 'Issuer must be at least 2 characters').max(100),
    issue_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
    expiry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format').optional().or(z.literal('')),
    credential_id: z.string().max(100).optional(),
    credential_url: z.string().url('Invalid URL').optional().or(z.literal('')),
    skills: z.array(z.string()),
    verified: z.boolean()
});

interface Certificate {
    id?: string;
    title: string;
    issuer: string;
    issue_date: string;
    expiry_date?: string;
    credential_id?: string;
    credential_url?: string;
    skills: string[];
    verified: boolean;
}

export const Certifications: React.FC = () => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [certificates, setCertificates] = useState<Certificate[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [filter, setFilter] = useState<'all' | 'active' | 'expired'>('all');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [newCert, setNewCert] = useState<Certificate>({
        title: '',
        issuer: '',
        issue_date: '',
        skills: [],
        verified: false
    });

    useEffect(() => {
        loadCertificates();
    }, []);

    const loadCertificates = async () => {
        setLoading(true);
        try {
            const certsData = await pb.collection('certifications').getList(1, 100, {
                filter: `user = "${user?.id}"`,
                sort: '-issue_date'
            });

            setCertificates(certsData.items as any);
        } catch (error) {
            console.error('Failed to load certifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveCertificate = async () => {
        try {
            // Sanitize inputs
            const sanitizedCert = {
                ...newCert,
                title: sanitizeText(newCert.title),
                issuer: sanitizeText(newCert.issuer),
                credential_id: newCert.credential_id ? sanitizeText(newCert.credential_id) : '',
                credential_url: newCert.credential_url ? sanitizeText(newCert.credential_url) : ''
            };

            // Validate with Zod
            const validationResult = certificateSchema.safeParse(sanitizedCert);
            if (!validationResult.success) {
                showToast(`Validation error: ${validationResult.error.issues[0].message}`, 'error');
                return;
            }

            if (editingId) {
                await pb.collection('certifications').update(editingId, sanitizedCert);
                showToast('Certificate updated!', 'success');
            } else {
                await pb.collection('certifications').create({
                    ...sanitizedCert,
                    user: user?.id
                });
                showToast('Certificate added!', 'success');
            }

            setShowAddModal(false);
            resetForm();
            loadCertificates();
        } catch (error) {
            showToast(editingId ? 'Failed to update certificate' : 'Failed to add certificate', 'error');
        }
    };

    const handleEdit = (cert: Certificate) => {
        setNewCert({
            title: cert.title,
            issuer: cert.issuer,
            issue_date: cert.issue_date.split('T')[0],
            expiry_date: cert.expiry_date ? cert.expiry_date.split('T')[0] : '',
            credential_id: cert.credential_id || '',
            credential_url: cert.credential_url || '',
            skills: cert.skills || [],
            verified: cert.verified
        });
        setEditingId(cert.id!);
        setShowAddModal(true);
    };

    const deleteCertificate = async (certId: string) => {
        if (confirm('Remove this certificate?')) {
            try {
                await pb.collection('certifications').delete(certId);
                showToast('Certificate removed', 'success');
                loadCertificates();
            } catch (error) {
                showToast('Failed to remove certificate', 'error');
            }
        }
    };

    const resetForm = () => {
        setNewCert({
            title: '',
            issuer: '',
            issue_date: '',
            skills: [],
            verified: false
        });
        setEditingId(null);
    };

    const isExpired = (cert: Certificate) => {
        if (!cert.expiry_date) return false;
        return new Date(cert.expiry_date) < new Date();
    };

    const filteredCerts = certificates.filter(cert => {
        if (filter === 'all') return true;
        if (filter === 'active') return !isExpired(cert);
        if (filter === 'expired') return isExpired(cert);
        return true;
    });

    const stats = {
        total: certificates.length,
        active: certificates.filter(c => !isExpired(c)).length,
        expired: certificates.filter(c => isExpired(c)).length,
        verified: certificates.filter(c => c.verified).length
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Icon name="ArrowPathIcon" className="w-8 h-8 text-gray-400 animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white">Certifications</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">Your professional credentials</p>
                </div>
                <Button variant="primary" onClick={() => { resetForm(); setShowAddModal(true); }}>
                    <Icon name="PlusIcon" className="w-5 h-5 mr-2" />
                    Add Certificate
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="p-6">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats.total}</p>
                </Card>
                <Card className="p-6">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Active</p>
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">{stats.active}</p>
                </Card>
                <Card className="p-6">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Expired</p>
                    <p className="text-3xl font-bold text-red-600 dark:text-red-400 mt-2">{stats.expired}</p>
                </Card>
                <Card className="p-6">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Verified</p>
                    <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">{stats.verified}</p>
                </Card>
            </div>

            {/* Filters */}
            <div className="flex gap-2">
                {(['all', 'active', 'expired'] as const).map(f => (
                    <Button
                        key={f}
                        variant={filter === f ? 'primary' : 'outline'}
                        size="sm"
                        onClick={() => setFilter(f)}
                    >
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                    </Button>
                ))}
            </div>

            {/* Certificates List */}
            <div className="space-y-4">
                {filteredCerts.map(cert => (
                    <motion.div
                        key={cert.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                    >
                        <Card className={`p-6 ${isExpired(cert) ? 'opacity-60' : ''}`}>
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                                            <Icon name="AcademicCapIcon" className="w-8 h-8 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{cert.title}</h3>
                                            <p className="text-gray-600 dark:text-gray-400">{cert.issuer}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                                        <div>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">Issued</p>
                                            <p className="font-semibold text-gray-900 dark:text-white">
                                                {new Date(cert.issue_date).toLocaleDateString()}
                                            </p>
                                        </div>
                                        {cert.expiry_date && (
                                            <div>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">Expires</p>
                                                <p className={`font-semibold ${isExpired(cert) ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>
                                                    {new Date(cert.expiry_date).toLocaleDateString()}
                                                    {isExpired(cert) && ' (Expired)'}
                                                </p>
                                            </div>
                                        )}
                                        {cert.credential_id && (
                                            <div>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">Credential ID</p>
                                                <p className="font-mono text-sm text-gray-900 dark:text-white">{cert.credential_id}</p>
                                            </div>
                                        )}
                                    </div>

                                    {cert.skills && cert.skills.length > 0 && (
                                        <div className="mt-4">
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Skills:</p>
                                            <div className="flex flex-wrap gap-2">
                                                {cert.skills.map((skill, i) => (
                                                    <span key={i} className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm font-semibold">
                                                        {skill}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {cert.credential_url && (
                                        <div className="mt-4">
                                            <a
                                                href={cert.credential_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-semibold"
                                            >
                                                View Credential →
                                            </a>
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-col gap-2">
                                    {cert.verified && (
                                        <span className="px-3 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full text-xs font-semibold flex items-center gap-1">
                                            <Icon name="CheckBadgeIcon" className="w-4 h-4" />
                                            Verified
                                        </span>
                                    )}
                                    <Button variant="ghost" size="sm" onClick={() => handleEdit(cert)}>
                                        <Icon name="PencilSquareIcon" className="w-4 h-4 text-gray-500" />
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => deleteCertificate(cert.id!)}>
                                        <Icon name="TrashIcon" className="w-4 h-4 text-red-500" />
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {filteredCerts.length === 0 && (
                <Card className="p-12 text-center">
                    <Icon name="AcademicCapIcon" className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Certifications Yet</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                        Add your professional certifications and credentials
                    </p>
                    <Button variant="primary" onClick={() => { resetForm(); setShowAddModal(true); }}>
                        Add Certificate
                    </Button>
                </Card>
            )}

            {/* Add/Edit Certificate Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <Card className="max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                            {editingId ? 'Edit Certificate' : 'Add Certificate'}
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold mb-2">Certificate Title</label>
                                <input
                                    type="text"
                                    className="w-full p-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg"
                                    value={newCert.title}
                                    onChange={(e) => setNewCert({ ...newCert, title: e.target.value })}
                                    placeholder="AWS Certified Solutions Architect"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold mb-2">Issuing Organization</label>
                                <input
                                    type="text"
                                    className="w-full p-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg"
                                    value={newCert.issuer}
                                    onChange={(e) => setNewCert({ ...newCert, issuer: e.target.value })}
                                    placeholder="Amazon Web Services"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold mb-2">Issue Date</label>
                                    <input
                                        type="date"
                                        className="w-full p-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg"
                                        value={newCert.issue_date}
                                        onChange={(e) => setNewCert({ ...newCert, issue_date: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold mb-2">Expiry Date (Optional)</label>
                                    <input
                                        type="date"
                                        className="w-full p-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg"
                                        value={newCert.expiry_date || ''}
                                        onChange={(e) => setNewCert({ ...newCert, expiry_date: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold mb-2">Credential ID (Optional)</label>
                                <input
                                    type="text"
                                    className="w-full p-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg"
                                    value={newCert.credential_id || ''}
                                    onChange={(e) => setNewCert({ ...newCert, credential_id: e.target.value })}
                                    placeholder="ABC123XYZ"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold mb-2">Credential URL (Optional)</label>
                                <input
                                    type="url"
                                    className="w-full p-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg"
                                    value={newCert.credential_url || ''}
                                    onChange={(e) => setNewCert({ ...newCert, credential_url: e.target.value })}
                                    placeholder="https://..."
                                />
                            </div>

                            <div className="flex gap-2 justify-end mt-6">
                                <Button variant="outline" onClick={() => { setShowAddModal(false); resetForm(); }}>
                                    Cancel
                                </Button>
                                <Button
                                    variant="primary"
                                    onClick={handleSaveCertificate}
                                    disabled={!newCert.title || !newCert.issuer || !newCert.issue_date}
                                >
                                    {editingId ? 'Update Certificate' : 'Add Certificate'}
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default Certifications;
