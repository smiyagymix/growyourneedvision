import React from 'react';
import { Layout } from 'lucide-react';

export const TemplatesPanel: React.FC = () => {
  const templates = [
    { id: 1, name: 'Social Post', width: 1080, height: 1080 },
    { id: 2, name: 'Story', width: 1080, height: 1920 },
    { id: 3, name: 'Presentation', width: 1920, height: 1080 },
    { id: 4, name: 'Banner', width: 1200, height: 630 },
  ];

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-[#27272a] flex items-center gap-2">
        <Layout size={14} className="text-gray-400" />
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Templates</h3>
      </div>
      
      <div className="p-4 grid grid-cols-2 gap-3 overflow-y-auto">
        {templates.map((template) => (
          <div 
            key={template.id}
            className="aspect-square bg-gray-800 rounded border border-gray-700 hover:border-blue-500 cursor-pointer p-3 flex flex-col justify-center items-center text-center group"
          >
            <div className="w-8 h-8 bg-gray-700 rounded mb-2 group-hover:bg-blue-900/50 transition-colors" />
            <span className="text-xs text-gray-300 font-medium">{template.name}</span>
            <span className="text-[10px] text-gray-500">{template.width}x{template.height}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
