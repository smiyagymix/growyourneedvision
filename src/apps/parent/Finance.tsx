import React, { useState, useEffect } from 'react';
import { WidgetErrorBoundary } from '../../components/shared/ui/WidgetErrorBoundary';
import pb from '../../lib/pocketbase';
import { parentService } from '../../services/parentService';
import { financeService } from '../../services/financeService';
import { OwnerIcon } from '../../components/shared/OwnerIcons';

interface Props {
  activeTab: string;
  activeSubNav: string;
}

const ParentFinance: React.FC<Props> = ({ activeTab, activeSubNav }) => {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ due: 0, paid: 0 });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const user = pb.authStore.model;
      if (!user) return;

      // 1. Get children
      const children = await parentService.getChildren(user.id);
      if (children.length === 0) {
          setLoading(false);
          return;
      }

      // 2. Get invoices for all children
      // Construct filter: (student = "id1" || student = "id2" ...)
      const studentFilter = children.map(c => `student = "${c.id}"`).join(' || ');
      const invs = await financeService.getInvoices(studentFilter);
      
      setInvoices(invs);

      // 3. Calculate stats
      const due = invs
        .filter((i: any) => i.status === 'Pending' || i.status === 'Overdue')
        .reduce((sum: number, i: any) => sum + i.amount, 0);
        
      const paid = invs
        .filter((i: any) => i.status === 'Paid')
        .reduce((sum: number, i: any) => sum + i.amount, 0);

      setStats({ due, paid });

    } catch (error) {
      console.error('Error loading finance data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fadeIn space-y-6">
      <div className="flex items-center justify-between border-b border-gray-200/50 pb-4">
        <div>
            <h2 className="text-2xl font-black text-gyn-blue-dark">{activeTab}</h2>
            <p className="text-sm text-gray-500">Manage school fees and payments.</p>
        </div>
        <button className="bg-green-500 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md hover:bg-green-600 transition-colors flex items-center gap-2">
            <OwnerIcon name="CurrencyDollarIcon" className="w-4 h-4" />
            Make Payment
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-gyn-blue-dark to-gyn-blue-medium rounded-2xl p-6 text-white shadow-lg">
              <div className="text-xs font-bold opacity-80 uppercase mb-1">Total Due</div>
              <div className="text-4xl font-black mb-4">${stats.due.toFixed(2)}</div>
              <div className="text-xs opacity-70">Please pay pending invoices</div>
          </div>
          
          <div className="col-span-2 bg-white/60 backdrop-blur-xl border border-white/50 rounded-2xl shadow-glass-edge p-6">
              <h3 className="font-bold text-gray-800 mb-4">Recent Transactions</h3>
              <div className="space-y-3">
                  {loading ? (
                      <div className="text-center text-gray-500">Loading...</div>
                  ) : invoices.length === 0 ? (
                      <div className="text-center text-gray-500">No invoices found.</div>
                  ) : (
                      invoices.map((inv: any) => (
                          <div key={inv.id} className="flex items-center justify-between p-3 hover:bg-white/50 rounded-lg transition-colors border-b border-gray-100 last:border-0">
                              <div>
                                  <div className="font-bold text-sm text-gray-800">{inv.expand?.fee?.name || 'School Fee'}</div>
                                  <div className="text-xs text-gray-500">
                                      {inv.id.slice(0, 8)} • {new Date(inv.created).toLocaleDateString()} • {inv.expand?.student?.name}
                                  </div>
                              </div>
                              <div className="text-right">
                                  <div className="font-bold text-gray-800">${inv.amount.toFixed(2)}</div>
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                      inv.status === 'Paid' ? 'bg-green-50 text-green-600' : 
                                      inv.status === 'Overdue' ? 'bg-red-50 text-red-600' : 'bg-yellow-50 text-yellow-600'
                                  }`}>
                                      {inv.status}
                                  </span>
                              </div>
                          </div>
                      ))
                  )}
              </div>
          </div>
      </div>
    </div>
  );
};

export default ParentFinance;
