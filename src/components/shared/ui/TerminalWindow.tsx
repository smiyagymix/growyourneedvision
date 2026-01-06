import React from 'react';
import { Terminal } from './Terminal'; // Reusing existing terminal component

export const TerminalWindow: React.FC = () => {
  return (
    <div className="flex flex-col h-full bg-[#1e1e1e] border-t border-gray-700">
        <div className="flex items-center px-4 h-8 bg-[#2d2d2d] border-b border-black/20 gap-4 text-xs text-gray-400">
            <span className="hover:text-white cursor-pointer border-b border-transparent hover:border-white">TERMINAL</span>
            <span className="hover:text-white cursor-pointer border-b border-transparent hover:border-white">OUTPUT</span>
            <span className="hover:text-white cursor-pointer border-b border-transparent hover:border-white">DEBUG CONSOLE</span>
        </div>
        <div className="flex-1 overflow-hidden">
            <Terminal height="h-full" />
        </div>
    </div>
  );
};