
import React, { useState, useEffect, useRef } from 'react';
import { OwnerIcon } from '../OwnerIcons';

interface TerminalProps {
  initialLines?: string[];
  height?: string;
}

export const Terminal: React.FC<TerminalProps> = ({ initialLines = [], height = 'h-64' }) => {
  const [lines, setLines] = useState<string[]>(initialLines);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      const command = input.trim();
      setLines(prev => [...prev, `> ${command}`, processCommand(command)]);
      setInput('');
    }
  };

  const processCommand = (cmd: string): string => {
    switch(cmd.toLowerCase()) {
      case 'help': return 'Available commands: help, status, clear, version, login';
      case 'status': return 'System Nominal. All nodes operational.';
      case 'version': return 'v2.4.0-alpha';
      case 'clear': setLines([]); return '';
      case '': return '';
      default: return `Unknown command: ${cmd}`;
    }
  };

  return (
    <div className={`bg-[#0c0c0c] rounded-xl border border-gray-800 font-mono text-xs shadow-2xl overflow-hidden flex flex-col ${height}`}>
      {/* Header */}
      <div className="bg-[#1a1a1a] px-4 py-2 flex items-center justify-between border-b border-gray-800">
        <div className="flex gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
          <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
        </div>
        <div className="text-gray-500">root@gyn-os:~</div>
        <OwnerIcon name="CommandLineIcon" className="w-4 h-4 text-gray-600" />
      </div>

      {/* Body */}
      <div className="flex-1 p-4 overflow-y-auto text-green-400 space-y-1">
        <div className="opacity-50 mb-4">
          Grow Your Need OS [Version 2.4.0]<br/>
          (c) 2024 GYN Corp. All rights reserved.
        </div>
        {lines.map((line, i) => (
          <div key={i} className="break-all">{line}</div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-2 bg-[#111] border-t border-gray-800 flex items-center gap-2">
        <span className="text-blue-500 font-bold">{'>'}</span>
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-transparent border-none focus:outline-none text-green-400 placeholder-green-900"
          placeholder="Enter command..."
          autoFocus
        />
      </div>
    </div>
  );
};
