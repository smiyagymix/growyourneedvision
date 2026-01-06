import React from 'react';

export const DiffViewer: React.FC = () => {
  return (
    <div className="flex h-full font-mono text-xs bg-white">
        <div className="w-1/2 border-r border-gray-200">
            <div className="bg-red-50 text-red-900 p-2 border-b border-red-100 font-bold">Original</div>
            <div className="p-4 text-gray-600">
                <div className="bg-red-100/50 -mx-4 px-4">const oldFunction = () ={'>'} {'{'}</div>
                <div className="pl-4">return "deprecated";</div>
                <div>{'}'}</div>
            </div>
        </div>
        <div className="w-1/2">
            <div className="bg-green-50 text-green-900 p-2 border-b border-green-100 font-bold">Modified</div>
            <div className="p-4 text-gray-600">
                <div className="bg-green-100/50 -mx-4 px-4">const newFunction = () ={'>'} {'{'}</div>
                <div className="pl-4">return "optimized";</div>
                <div>{'}'}</div>
            </div>
        </div>
    </div>
  );
};