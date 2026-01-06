
import React from 'react';
import { OwnerIcon } from '../OwnerIcons';

// Note: A full DnD implementation requires a library like dnd-kit or react-beautiful-dnd.
// This is a UI scaffold for the Kanban structure.

export interface KanbanItem {
  id: string;
  title: string;
  tags?: string[];
  assignee?: string;
}

export interface KanbanColumn {
  id: string;
  title: string;
  color: string;
  items: KanbanItem[];
}

interface KanbanBoardProps {
  columns: KanbanColumn[];
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ columns }) => {
  return (
    <div className="flex h-full overflow-x-auto gap-6 p-2">
      {columns.map((col) => (
        <div key={col.id} className="w-80 flex-shrink-0 flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between mb-4 px-2">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${col.color}`}></div>
              <h3 className="font-bold text-sm text-gray-700 uppercase tracking-wider">{col.title}</h3>
              <span className="bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded-full font-bold">{col.items.length}</span>
            </div>
            <button className="text-gray-400 hover:text-gray-600">
              <OwnerIcon name="PlusCircleIcon" className="w-4 h-4" />
            </button>
          </div>

          {/* Drop Zone / List */}
          <div className="flex-1 bg-gray-50/50 rounded-xl border border-gray-100 p-2 space-y-3 overflow-y-auto custom-scrollbar">
            {col.items.map((item) => (
              <div 
                key={item.id} 
                className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all cursor-grab active:cursor-grabbing group"
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-sm font-bold text-gray-800 line-clamp-2">{item.title}</h4>
                  <button className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600 transition-opacity">
                    <OwnerIcon name="EllipsisHorizontalIcon" className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="flex items-center justify-between mt-3">
                  <div className="flex gap-1">
                    {item.tags?.map((tag, i) => (
                      <span key={i} className="text-[9px] font-bold uppercase bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-100">
                        {tag}
                      </span>
                    ))}
                  </div>
                  {item.assignee && (
                    <div className="w-6 h-6 rounded-full bg-gray-100 text-[9px] flex items-center justify-center font-bold border border-white shadow-sm text-gray-500">
                      {item.assignee.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>
              </div>
            ))}
            <button className="w-full py-2 border-2 border-dashed border-gray-200 rounded-lg text-xs font-bold text-gray-400 hover:border-blue-300 hover:text-blue-500 transition-colors flex items-center justify-center gap-1">
               <OwnerIcon name="PlusCircleIcon" className="w-3 h-3" /> Add Item
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
