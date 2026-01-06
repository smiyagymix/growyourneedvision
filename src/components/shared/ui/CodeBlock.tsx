
import React from 'react';
import { useClipboard } from '../../../hooks/useClipboard';
import { OwnerIcon } from '../OwnerIcons';

interface CodeBlockProps {
  code: string;
  language?: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ code, language = 'typescript' }) => {
  const { copied, copy } = useClipboard();

  return (
    <div className="bg-[#1e1e1e] rounded-xl overflow-hidden border border-gray-800 my-4 shadow-inner group">
      <div className="flex justify-between items-center px-4 py-2 bg-[#252526] border-b border-gray-800">
        <span className="text-xs font-mono text-gray-400 lowercase">{language}</span>
        <button 
            onClick={() => copy(code)} 
            className="text-xs text-gray-400 hover:text-white flex items-center gap-1 transition-colors"
        >
            {copied ? (
                <>
                    <OwnerIcon name="CheckCircleIcon" className="w-3 h-3 text-green-500" />
                    <span className="text-green-500">Copied</span>
                </>
            ) : (
                <>
                    <OwnerIcon name="DocumentTextIcon" className="w-3 h-3" />
                    Copy
                </>
            )}
        </button>
      </div>
      <div className="p-4 overflow-x-auto">
        <pre className="text-sm font-mono text-blue-100 leading-relaxed">
            <code>{code}</code>
        </pre>
      </div>
    </div>
  );
};
