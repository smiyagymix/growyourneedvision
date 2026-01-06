import React, { useState, useEffect } from 'react';
import { WidgetErrorBoundary } from '../../components/shared/ui/WidgetErrorBoundary';
import { Icon } from '../../components/shared/ui/CommonUI';
import { individualService, Recommendation } from '../../services/individualService';

interface Props {
  activeTab: string;
  activeSubNav: string;
}

const IndividualMarketplace: React.FC<Props> = ({ activeTab, activeSubNav }) => {
  const [items, setItems] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true);
      const data = await individualService.getMarketplaceItems();
      setItems(data);
      setLoading(false);
    };
    fetchItems();
  }, []);

  return (
    <div className="animate-fadeIn space-y-6">
      <div className="flex items-center justify-between border-b border-gray-200/50 pb-4">
        <div>
            <h2 className="text-2xl font-black text-gyn-blue-dark dark:text-white">{activeTab}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Discover products and services.</p>
        </div>
        <div className="relative">
            <input type="text" placeholder="Search..." className="pl-8 pr-4 py-2 rounded-full bg-white/50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64 text-gray-800 dark:text-white" />
            <Icon name="MagnifyingGlassIcon" className="w-4 h-4 text-gray-400 absolute left-2.5 top-2.5" />
        </div>
      </div>
      
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading marketplace...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No items found.</div>
      ) : (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {items.map((item) => (
              <div key={item.id} className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-white/50 dark:border-slate-700 rounded-2xl shadow-glass-edge overflow-hidden group hover:shadow-lg transition-all cursor-pointer">
                  <div className={`h-40 bg-gray-500 relative flex items-center justify-center`}>
                      {item.image_url ? (
                          <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                      ) : (
                          <Icon name="ShoppingBagIcon" className="w-12 h-12 text-white opacity-50" />
                      )}
                      <div className="absolute top-2 right-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur px-2 py-1 rounded-full text-xs font-bold shadow-sm text-gray-800 dark:text-white">${item.price}</div>
                  </div>
                  <div className="p-4">
                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{item.category || item.item_type}</div>
                      <h3 className="font-bold text-gray-800 dark:text-white mb-3">{item.title}</h3>
                      <button className="w-full py-2 bg-gray-900 dark:bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-black dark:hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                          <Icon name="PlusCircleIcon" className="w-3 h-3" />
                          Add to Cart
                      </button>
                  </div>
              </div>
          ))}
      </div>
      )}
    </div>
  );
};

export default IndividualMarketplace;
