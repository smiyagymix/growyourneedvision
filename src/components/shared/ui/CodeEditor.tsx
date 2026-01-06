import React from 'react';

interface CodeEditorProps {
  value: string;
  language?: string;
  onChange?: (value: string) => void;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({ value, language = 'javascript', onChange }) => {
  return (
    <div className="font-mono text-sm bg-[#1e1e1e] text-gray-300 p-4 rounded-lg border border-gray-700 overflow-auto h-full">
      <div className="flex justify-between mb-2 text-xs text-gray-500 uppercase">
          <span>{language}</span>
          <span>Read-only Mode (Simulated)</span>
      </div>
      <textarea 
        className="w-full h-full bg-transparent outline-none resize-none text-green-400"
        value={value}
        onChange={(e) => onChange && onChange(e.target.value)}
        spellCheck={false}
      />
    </div>
  );
};