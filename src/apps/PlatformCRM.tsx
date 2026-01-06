import React, { useState, useEffect, Suspense } from 'react';
import { Icon, Card, Button, Badge, Avatar, Modal } from '../components/shared/ui/CommonUI';
import { DropdownMenu } from '../components/shared/ui/DropdownMenu';
import { Input } from '../components/shared/ui/Input';
import { Select } from '../components/shared/ui/Select';
import { crmService, Deal, Contact, ForecastData } from '../services/crmService';
import { tenantService, Tenant } from '../services/tenantService';
import { reportService } from '../services/reportService';
import { AIContentGeneratorModal } from '../components/shared/modals/AIContentGeneratorModal';

// Lazy load CRM components
const ContactsManager = React.lazy(() => import('./crm/ContactsManager'));
const EmailIntegration = React.lazy(() => import('./crm/EmailIntegration'));
const CRMAnalytics = React.lazy(() => import('./crm/CRMAnalytics'));
const DealAssignment = React.lazy(() => import('./crm/DealAssignment'));
const DealEnhancements = React.lazy(() => import('./crm/DealEnhancements'));

interface PlatformCRMProps {
    activeTab: string;
    activeSubNav: string;
}

const PlatformCRM: React.FC<PlatformCRMProps> = ({ activeTab, activeSubNav }) => {
    const [deals, setDeals] = useState<Deal[]>([]);
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [forecast, setForecast] = useState<ForecastData[]>([]);
    const [accounts, setAccounts] = useState<Tenant[]>([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isAIModalOpen, setIsAIModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [newDeal, setNewDeal] = useState<{
        title: string;
        value: number;
        stage: Deal['stage'];
        description: string;
        contact_name: string;
        assigned_to: string;
    }>({
        title: '',
        value: 0,
        stage: 'Lead',
        description: '',
        contact_name: '',
        assigned_to: 'u1'
    });

    const handleSaveDeal = async () => {
        if (!newDeal.title) return;

        try {
            if (editingId) {
                await crmService.updateDeal(editingId, newDeal);
            } else {
                await crmService.createDeal(newDeal);
            }

            setIsModalOpen(false);
            // Refresh
            const result = await crmService.getDeals();
            setDeals(result);
            // Reset form
            resetForm();
        } catch (e) {
            console.error(e);
            alert(editingId ? "Failed to update deal" : "Failed to create deal");
        }
    };

    const handleEditDeal = (deal: Deal) => {
        setNewDeal({
            title: deal.title,
            value: deal.value,
            stage: deal.stage,
            description: deal.description,
            contact_name: deal.contact_name,
            assigned_to: deal.assigned_to
        });
        setEditingId(deal.id);
        setIsModalOpen(true);
    };

    const resetForm = () => {
        setNewDeal({
            title: '',
            value: 0,
            stage: 'Lead',
            description: '',
            contact_name: '',
            assigned_to: 'u1'
        });
        setEditingId(null);
    };

    const handleDeleteDeal = async (id: string) => {
        if (!window.confirm("Delete this deal?")) return;
        await crmService.deleteDeal(id);
        setDeals(deals.filter(d => d.id !== id));
    };

    const handleDragStart = (e: React.DragEvent, dealId: string) => {
        e.dataTransfer.setData('dealId', dealId);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = async (e: React.DragEvent, stage: Deal['stage']) => {
        e.preventDefault();
        const dealId = e.dataTransfer.getData('dealId');
        if (!dealId) return;

        // Optimistic update
        const deal = deals.find(d => d.id === dealId);
        if (deal && deal.stage !== stage) {
            const updatedDeals = deals.map(d => d.id === dealId ? { ...d, stage } : d);
            setDeals(updatedDeals);

            await crmService.updateDealStage(dealId, stage);
        }
    };

    const calculateForecast = (dealsData: Deal[]): ForecastData[] => {
        const today = new Date();
        const currentYear = today.getFullYear();
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']; // Q1-Q2

        const data = months.map((month, index) => ({
            month,
            projected: 0,
            actual: 0,
            predicted: 0,
            closed: 0,
            pipeline: 0
        }));

        dealsData.forEach(deal => {
            // If no date, assume current month for simplicity or skip
            const date = deal.expected_close_date ? new Date(deal.expected_close_date) : new Date();
            const monthIndex = date.getMonth();

            if (monthIndex < 6) {
                // Projected: Value * Probability (default to 50% if not set)
                const prob = deal.probability !== undefined ? deal.probability : 50;
                data[monthIndex].projected += deal.value * (prob / 100);

                // Actual: Only if Closed Won / Subscribed
                if (['Closed Won', 'Subscribed'].includes(deal.stage)) {
                    data[monthIndex].actual += deal.value;
                    data[monthIndex].closed += deal.value;
                }
            }
        });
        return data;
    };

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                if (activeTab === 'Sales Pipeline') {
                    if (activeSubNav === 'Contacts') {
                        const result = await crmService.getContacts();
                        setContacts(result);
                    } else if (activeSubNav === 'Forecast') {
                        // Calculate forecast from deals
                        const dealsResult = await crmService.getDeals();
                        setDeals(dealsResult);
                        setForecast(calculateForecast(dealsResult));
                    } else {
                        // Default to Deals
                        const result = await crmService.getDeals();
                        setDeals(result);
                    }
                } else if (activeTab === 'Tenant Accounts') {
                    let filter = '';
                    if (activeSubNav === 'Active') {
                        filter = 'status = "active"';
                    } else if (activeSubNav === 'Onboarding') {
                        filter = 'status = "trial"';
                    }
                    const result = await tenantService.getTenants(filter);
                    setAccounts(result.items);
                }
            } catch (error) {
                console.error('Failed to fetch data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [activeTab, activeSubNav]);

    const getDealsByStage = (stage: string) => {
        return deals.filter(d => d.stage === stage);
    };

    const handleExportDeals = (format: 'pdf' | 'excel') => {
        if (deals.length === 0) {
            alert('No deals to export');
            return;
        }

        const headers = ['Title', 'Stage', 'Value', 'Contact', 'Assigned To', 'Created'];
        const data = deals.map(d => [
            d.title,
            d.stage,
            `$${d.value.toLocaleString()}`,
            d.contact_name || 'N/A',
            d.assigned_to || 'Unassigned',
            new Date(d.created || Date.now()).toLocaleDateString()
        ]);

        if (format === 'pdf') {
            reportService.exportToPDF('CRM Deals Report', headers, data, 'crm-deals');
        } else {
            const excelData = deals.map(d => ({
                Title: d.title,
                Stage: d.stage,
                Value: d.value,
                Contact: d.contact_name || 'N/A',
                'Assigned To': d.assigned_to || 'Unassigned',
                Description: d.description || '',
                Created: new Date(d.created || Date.now()).toLocaleDateString()
            }));
            reportService.exportToExcel(excelData, 'CRM Deals', 'crm-deals');
        }
    };

    const handleExportForecast = (format: 'pdf' | 'excel') => {
        if (forecast.length === 0) {
            alert('No forecast data to export');
            return;
        }

        const headers = ['Month', 'Predicted', 'Closed', 'Pipeline'];
        const data = forecast.map(f => [
            f.month,
            `$${f.predicted.toLocaleString()}`,
            `$${f.closed.toLocaleString()}`,
            `$${f.pipeline.toLocaleString()}`
        ]);

        if (format === 'pdf') {
            reportService.exportToPDF('Revenue Forecast Report', headers, data, 'revenue-forecast');
        } else {
            const excelData = forecast.map(f => ({
                Month: f.month,
                'Predicted Revenue': f.predicted,
                'Closed Revenue': f.closed,
                'Pipeline Value': f.pipeline,
                'Close Rate': `${((f.closed / f.predicted) * 100).toFixed(1)}%`
            }));
            reportService.exportToExcel(excelData, 'Revenue Forecast', 'revenue-forecast');
        }
    };

    return (
        <div className="w-full h-full flex flex-col space-y-2 animate-fadeIn">
            <div className="flex justify-between items-center shrink-0 border-b border-gray-200/50 dark:border-gray-700 pb-2">
                <div>
                    <h1 className="text-sm md:text-base font-black text-gyn-blue-dark dark:text-white tracking-tight">Platform CRM</h1>
                    <p className="text-[8px] text-gray-500 dark:text-gray-400 mt-0.5">Customer Relationship Management</p>
                </div>
                <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-0.5 rounded-lg shadow-inner">
                    <button onClick={() => handleExportDeals('pdf')} className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-400" title="Export PDF">
                        <Icon name="DocumentText" className="w-3 h-3" />
                    </button>
                    <button onClick={() => handleExportDeals('excel')} className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-400" title="Export Excel">
                        <Icon name="TableCells" className="w-3 h-3" />
                    </button>
                    <div className="w-px bg-gray-300 dark:bg-gray-600 mx-0.5"></div>
                    <button className="p-1 rounded-md bg-white dark:bg-gray-700 shadow-sm border border-gray-200 dark:border-gray-600 text-gyn-blue-dark dark:text-white">
                        <Icon name="Grid" className="w-3 h-3" />
                    </button>
                    <button className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-400">
                        <Icon name="List" className="w-3 h-3" />
                    </button>
                </div>
            </div>

            {/* Kanban Board Simulation for Sales Pipeline */}
            {activeTab === 'Sales Pipeline' && (!activeSubNav || activeSubNav === 'Deals') && (
                <div className="flex-1 overflow-x-auto pb-2">
                    <div className="flex space-x-3 h-full min-w-max px-1">
                        {['Lead', 'Contacted', 'Demo Scheduled', 'Trial', 'Subscribed'].map((stage, idx) => {
                            const stageDeals = getDealsByStage(stage);
                            return (
                                <div key={stage} className="w-64 flex flex-col max-h-full">
                                    {/* Column Header */}
                                    <div className="mb-1.5 flex items-center justify-between px-0.5">
                                        <h3 className="font-bold text-[9px] text-gyn-grey dark:text-gray-300 uppercase tracking-wider flex items-center gap-1">
                                            <div className={`w-1.5 h-1.5 rounded-full ${['bg-gray-400', 'bg-blue-400', 'bg-purple-400', 'bg-orange-400', 'bg-green-400'][idx]}`}></div>
                                            {stage}
                                        </h3>
                                        <span className="bg-gray-200/50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-1.5 py-0.5 rounded-full text-[8px] font-bold border border-gray-200 dark:border-gray-600">{stageDeals.length}</span>
                                    </div>

                                    {/* Column Track */}
                                    <div
                                        className="flex-1 bg-gray-100/50 dark:bg-gray-800/50 rounded-xl border border-gray-200/60 dark:border-gray-700 p-1.5 space-y-2 overflow-y-auto no-scrollbar shadow-inner"
                                        onDragOver={handleDragOver}
                                        onDrop={(e) => handleDrop(e, stage as Deal['stage'])}
                                    >
                                        {loading ? (
                                            <div className="text-center py-2 text-gray-400 text-[9px]">Loading...</div>
                                        ) : stageDeals.map((deal) => (
                                            <Card
                                                key={deal.id}
                                                className="p-2 hover:shadow-[0_5px_15px_rgba(0,0,0,0.1)] hover:-translate-y-1 transition-all cursor-grab active:cursor-grabbing group relative overflow-hidden"
                                                draggable
                                                onDragStart={(e) => handleDragStart(e, deal.id)}
                                            >
                                                {/* Side Color Strip */}
                                                <div className={`absolute left-0 top-0 bottom-0 w-0.5 ${['bg-gray-300', 'bg-blue-300', 'bg-purple-300', 'bg-orange-300', 'bg-green-300'][idx]}`}></div>

                                                <div className="flex justify-between mb-1 pl-1">
                                                    <span className="text-[9px] font-bold text-gyn-blue-dark dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{deal.title}</span>
                                                    <DropdownMenu
                                                        align="right"
                                                        trigger={
                                                            <button className="text-gray-300 hover:text-gray-500 dark:hover:text-gray-400">
                                                                <Icon name="EllipsisHorizontalIcon" className="w-3 h-3" />
                                                            </button>
                                                        }
                                                        items={[
                                                            { label: 'Edit', icon: 'PencilSquareIcon', onClick: () => handleEditDeal(deal) },
                                                            { label: 'Delete', icon: 'Trash', onClick: () => handleDeleteDeal(deal.id), danger: true }
                                                        ]}
                                                    />
                                                </div>

                                                <p className="text-[8px] text-gray-500 dark:text-gray-400 mb-1.5 pl-1 leading-relaxed">{deal.description}</p>

                                                <div className="flex items-center justify-between pl-1 border-t border-gray-50 dark:border-gray-700 pt-1">
                                                    <div className="text-[9px] font-black text-gray-700 dark:text-gray-300">${deal.value.toLocaleString()}</div>
                                                    <div className="flex -space-x-0.5">
                                                        <div className="w-4 h-4 rounded-full bg-gyn-orange text-[7px] flex items-center justify-center text-white font-bold border border-white dark:border-gray-800 shadow-sm z-10">
                                                            {deal.assigned_to ? deal.assigned_to.substring(0, 2).toUpperCase() : 'UN'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </Card>
                                        ))}

                                        <button
                                            onClick={() => { resetForm(); setIsModalOpen(true); }}
                                            className="w-full py-1.5 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg text-[9px] font-bold text-gray-400 hover:border-gyn-blue-medium hover:text-gyn-blue-medium dark:hover:text-blue-400 transition-colors flex items-center justify-center gap-0.5"
                                        >
                                            <Icon name="PlusCircleIcon" className="w-2.5 h-2.5" /> Add Deal
                                        </button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* Contacts View */}
            {activeTab === 'Sales Pipeline' && activeSubNav === 'Contacts' && (
                <Suspense fallback={
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                    </div>
                }>
                    <ContactsManager />
                </Suspense>
            )}

            {/* Analytics View */}
            {activeTab === 'Sales Pipeline' && activeSubNav === 'Analytics' && (
                <Suspense fallback={<div>Loading analytics...</div>}>
                    <CRMAnalytics />
                </Suspense>
            )}

            {/* Assignments View */}
            {activeTab === 'Sales Pipeline' && activeSubNav === 'Assignments' && (
                <Suspense fallback={<div>Loading assignments...</div>}>
                    <DealAssignment />
                </Suspense>
            )}

            {/* Deal Enhancements View */}
            {activeTab === 'Sales Pipeline' && activeSubNav === 'Enhancements' && (
                <Suspense fallback={<div>Loading enhancements...</div>}>
                    <DealEnhancements />
                </Suspense>
            )}

            {/* Email Integration View */}
            {(activeTab === 'Communication' || activeSubNav === 'Email') && (
                <Suspense fallback={<div>Loading email center...</div>}>
                    <EmailIntegration />
                </Suspense>
            )}

            {/* Forecast View */}
            {activeTab === 'Sales Pipeline' && activeSubNav === 'Forecast' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    <Card className="p-3">
                        <h3 className="font-bold text-gray-800 dark:text-white mb-3 text-sm">Revenue Forecast</h3>
                        <div className="space-y-2">
                            {Array.isArray(forecast) && forecast.map((item, i) => (
                                <div key={i} className="space-y-1">
                                    <div className="flex justify-between text-[9px] font-bold">
                                        <span className="text-gray-600 dark:text-gray-300">{item.month}</span>
                                        <div className="flex gap-2">
                                            <span className="text-gray-400">Proj: ${item.projected?.toLocaleString() || 0}</span>
                                            <span className={(item.actual || 0) >= (item.projected || 0) ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}>
                                                Act: ${item.actual?.toLocaleString() || 0}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden flex">
                                        <div className="bg-blue-200 dark:bg-blue-900 h-full" style={{ width: `${((item.projected || 0) / 100000) * 100}%` }}></div>
                                        <div className="bg-blue-600 dark:bg-blue-500 h-full -ml-full opacity-50" style={{ width: `${((item.actual || 0) / 100000) * 100}%` }}></div>
                                    </div>
                                </div>
                            ))}
                            {!Array.isArray(forecast) && <div className="text-red-500 text-[9px]">Error loading forecast data</div>}
                        </div>
                    </Card>
                    <div className="bg-gradient-to-br from-gyn-blue-dark to-blue-900 rounded-xl shadow-lg p-4 text-white flex flex-col justify-center items-center text-center">
                        <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mb-3 backdrop-blur-sm">
                            <Icon name="ArrowTrendingUpIcon" className="w-6 h-6 text-green-400" />
                        </div>
                        <h2 className="text-2xl font-black mb-1">$425,000</h2>
                        <p className="text-blue-200 font-medium mb-4 text-[9px]">Total Projected Revenue (Q1-Q2)</p>
                        <div className="flex gap-1">
                            <Button variant="secondary" className="bg-white text-blue-900 hover:bg-blue-50 text-[10px] px-2 py-1" onClick={() => handleExportForecast('pdf')}>Download PDF</Button>
                            <Button variant="secondary" className="bg-blue-800 text-white hover:bg-blue-700 border border-blue-700 text-[10px] px-2 py-1" onClick={() => handleExportForecast('excel')}>Export Excel</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* CRM Accounts List View */}
            {activeTab === 'Tenant Accounts' && (
                <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-xl border border-white/50 dark:border-gray-700 shadow-glass-edge p-4 text-center flex flex-col items-center justify-center h-full">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-50 to-white dark:from-gray-700 dark:to-gray-600 rounded-full flex items-center justify-center shadow-inner mb-3">
                        <Icon name="Calculator" className="w-8 h-8 text-gyn-blue-medium dark:text-blue-400 opacity-50" />
                    </div>
                    <h3 className="text-base font-black text-gyn-blue-dark dark:text-white mb-1">CRM Accounts View</h3>
                    <p className="text-gray-500 dark:text-gray-400 max-w-md mb-3 text-[9px]">
                        You are viewing the <span className="font-bold text-gray-800 dark:text-white">{activeSubNav || 'All'}</span> tenant directory. Select an account to view detailed relationship history and metrics.
                    </p>

                    {/* Account List */}
                    <div className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden text-left">
                        <div className="p-2 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex justify-between items-center">
                            <h4 className="font-bold text-gray-700 dark:text-gray-300 text-[10px]">Accounts ({accounts.length})</h4>
                            <button className="text-[8px] text-blue-600 dark:text-blue-400 font-bold hover:underline">View All</button>
                        </div>
                        <div className="divide-y divide-gray-50 dark:divide-gray-800 max-h-64 overflow-y-auto">
                            {loading ? (
                                <div className="p-4 text-center text-gray-400 text-[9px]">Loading accounts...</div>
                            ) : accounts.length === 0 ? (
                                <div className="p-4 text-center text-gray-400 text-[9px]">No accounts found.</div>
                            ) : (
                                accounts.map(account => (
                                    <div key={account.id} className="p-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center justify-between group cursor-pointer">
                                        <div className="flex items-center gap-2">
                                            <div className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400 font-bold text-[8px] uppercase">
                                                {account.name.substring(0, 2)}
                                            </div>
                                            <div>
                                                <div className="font-bold text-gray-800 dark:text-white text-[10px]">{account.name}</div>
                                                <div className="text-[8px] text-gray-400">{account.type} • {account.contact_email}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant={
                                                account.status === 'active' ? 'success' :
                                                    account.status === 'trial' ? 'warning' :
                                                        'default'
                                            }>
                                                {account.status}
                                            </Badge>
                                            <Icon name="ChevronRight" className="w-3 h-3 text-gray-300 group-hover:text-gray-500" />
                                        </div>
                                    </div>
                                )))}
                        </div>
                    </div>
                </div>
            )}

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingId ? "Edit Deal" : "Create New Deal"}
                footer={
                    <Button
                        variant="primary"
                        onClick={handleSaveDeal}
                    >
                        {editingId ? "Update Deal" : "Create Deal"}
                    </Button>
                }
            >
                <div className="space-y-4">
                    <Input
                        label="Deal Title"
                        value={newDeal.title}
                        onChange={(e) => setNewDeal({ ...newDeal, title: e.target.value })}
                        placeholder="e.g. Enterprise License"
                    />
                    <Input
                        label="Value ($)"
                        type="number"
                        value={newDeal.value}
                        onChange={(e) => setNewDeal({ ...newDeal, value: Number(e.target.value) })}
                    />
                    <Select
                        label="Stage"
                        value={newDeal.stage}
                        onChange={(e) => setNewDeal({ ...newDeal, stage: e.target.value as Deal['stage'] })}
                    >
                        <option value="Lead">Lead</option>
                        <option value="Contacted">Contacted</option>
                        <option value="Demo Scheduled">Demo Scheduled</option>
                        <option value="Trial">Trial</option>
                        <option value="Subscribed">Subscribed</option>
                    </Select>
                    <Input
                        label="Contact Name"
                        value={newDeal.contact_name}
                        onChange={(e) => setNewDeal({ ...newDeal, contact_name: e.target.value })}
                        placeholder="Primary contact person"
                    />
                    <div>
                        <div className="flex justify-between items-center mb-1.5">
                            <label className="block text-xs font-bold text-gray-700 ml-1 uppercase tracking-wide">Description</label>
                            <button
                                onClick={() => setIsAIModalOpen(true)}
                                className="text-[10px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                            >
                                <Icon name="Sparkles" className="w-3 h-3" /> AI Assist
                            </button>
                        </div>
                        <Input
                            value={newDeal.description}
                            onChange={(e) => setNewDeal({ ...newDeal, description: e.target.value })}
                            placeholder="Brief description of the opportunity"
                        />
                    </div>
                </div>
            </Modal>

            <AIContentGeneratorModal
                isOpen={isAIModalOpen}
                onClose={() => setIsAIModalOpen(false)}
                onSuccess={(content) => {
                    setNewDeal({ ...newDeal, description: content });
                    setIsAIModalOpen(false);
                }}
                title="Generate Deal Description"
                promptTemplate={`Write a professional deal description for a potential sale.
        
        Deal Title: ${newDeal.title || '[Title]'}
        Value: $${newDeal.value || 0}
        Stage: ${newDeal.stage}
        
        Include:
        - Key Requirements
        - Next Steps
        - Potential Risks`}
                contextData={{ deal: newDeal }}
            />
        </div>
    );
};

export default PlatformCRM;
