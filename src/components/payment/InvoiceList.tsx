import React, { useEffect, useState } from 'react';
import { paymentService } from '../../services/paymentService';
import { Invoice } from '../../types/payment';
import { OwnerIcon } from '../shared/OwnerIcons';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';

export const InvoiceList: React.FC = () => {
    const { user } = useAuth();
    const { addToast } = useToast();
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [downloadingId, setDownloadingId] = useState<string | null>(null);

    useEffect(() => {
        const loadInvoices = async () => {
            if (user) {
                const data = await paymentService.getInvoices(user.id);
                setInvoices(data);
                setLoading(false);
            }
        };
        loadInvoices();
    }, [user]);

    if (loading) {
        return <div className="animate-pulse h-20 bg-gray-100 rounded-xl"></div>;
    }

    const handleDownload = async (invoice: Invoice) => {
        setDownloadingId(invoice.id);
        try {
            const url = await paymentService.downloadReceipt(undefined, invoice.id);
            if (!url) {
                addToast('Receipt not ready yet. Please check back in a moment.', 'warning');
                return;
            }
            const link = document.createElement('a');
            link.href = url;
            link.download = `receipt-${invoice.id.substring(0, 8)}.json`;
            link.click();
            URL.revokeObjectURL(url);
        } catch (e) {
            console.error(e);
            addToast('Unable to download receipt right now.', 'error');
        } finally {
            setDownloadingId(null);
        }
    };

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Billing History</h3>

            {invoices.length === 0 ? (
                <div className="p-6 bg-gray-50 rounded-xl border border-dashed border-gray-300 text-center">
                    <p className="text-gray-500 text-sm">No invoices found.</p>
                </div>
            ) : (
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
                            <tr>
                                <th className="px-4 py-3">Date</th>
                                <th className="px-4 py-3">Amount</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {invoices.map((invoice) => (
                                <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-3 text-gray-900">
                                        {new Date(invoice.created).toLocaleDateString()}
                                    </td>
                                    <td className="px-4 py-3 font-medium text-gray-900">
                                        ${(invoice.amount_paid / 100).toFixed(2)}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                                                invoice.status === 'open' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-red-100 text-red-800'
                                            }`}>
                                            {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <button
                                            className="text-blue-600 hover:text-blue-800 font-medium text-xs flex items-center justify-end gap-1 ml-auto disabled:opacity-60"
                                            onClick={() => handleDownload(invoice)}
                                            disabled={!!downloadingId}
                                        >
                                            <OwnerIcon name="Download" className="w-3 h-3" /> PDF
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};
