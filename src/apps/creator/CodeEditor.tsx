import React, { useState } from 'react';
import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-html'; // Added for HTML highlighting
import 'prismjs/components/prism-css'; // Added for CSS highlighting
import 'prismjs/themes/prism-dark.css'; // or any other theme
import { Icon } from '../../components/shared/ui/CommonUI';

export const CodeEditor: React.FC = () => {
    const [files, setFiles] = useState([
        { id: '1', name: 'index.js', content: '// Welcome to the Creative Studio Code Editor\nfunction greeting(name) {\n  return "Hello, " + name + "!";\n}\n\nconsole.log(greeting("World"));\n' },
        { id: '2', name: 'styles.css', content: '/* Add your styles here */\nbody {\n  background: #1e1e1e;\n  color: white;\n}\n' },
        { id: '3', name: 'index.html', content: '<!DOCTYPE html>\n<html>\n<body>\n  <h1 id="title">Hello World</h1>\n</body>\n</html>\n' }
    ]);
    const [activeFileId, setActiveFileId] = useState('1');
    const activeFile = files.find(f => f.id === activeFileId) || files[0];

    const updateActiveFileContent = (newContent: string) => {
        setFiles(prev => prev.map(f => f.id === activeFileId ? { ...f, content: newContent } : f));
    };

    const addFile = () => {
        const name = prompt('File name:');
        if (name) {
            const newFile = { id: Date.now().toString(), name, content: '' };
            setFiles([...files, newFile]);
            setActiveFileId(newFile.id);
        }
    };

    const deleteFile = (id: string) => {
        if (files.length > 1) {
            setFiles(files.filter(f => f.id !== id));
            if (activeFileId === id) {
                setActiveFileId(files.find(f => f.id !== id)!.id);
            }
        }
    };

    return (
        <div className="h-full flex flex-col bg-[#1e1e1e] text-white">
            {/* Toolbar */}
            <div className="h-12 border-b border-[#333] flex items-center px-4 justify-between bg-[#252526]">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-blue-400 font-bold">
                        <Icon name="CodeBracketIcon" className="w-5 h-5" />
                        <span>Code Editor</span>
                    </div>
                    <div className="h-4 w-[1px] bg-[#333]"></div>
                    {/* Removed language select as it's now dynamic per file */}
                </div>
                <div className="flex items-center gap-2">
                    <button className="p-1.5 hover:bg-[#333] rounded text-gray-400 hover:text-white" title="Run Code">
                        <Icon name="PlayIcon" className="w-4 h-4" />
                    </button>
                    <button className="p-1.5 hover:bg-[#333] rounded text-gray-400 hover:text-white" title="Settings">
                        <Icon name="CogIcon" className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Sidebar & Editor Area */}
            <div className="flex-1 flex overflow-hidden">
                {/* File Explorer Sidebar */}
                <div className="w-52 bg-[#252526] border-r border-[#333] flex flex-col">
                    <div className="p-3 flex items-center justify-between text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                        <span>Explorer</span>
                        <button onClick={addFile} className="hover:text-white transition-colors">
                            <Icon name="PlusCircleIcon" className="w-3 h-3" />
                        </button>
                    </div>
                    <div className="flex-1 overflow-auto">
                        {files.map(file => (
                            <div
                                key={file.id}
                                onClick={() => setActiveFileId(file.id)}
                                className={`flex items-center justify-between px-3 py-1.5 cursor-pointer text-xs group ${activeFileId === file.id ? 'bg-[#37373d] text-white' : 'text-gray-400 hover:bg-[#2a2d2e] hover:text-gray-200'}`}
                            >
                                <div className="flex items-center gap-2 truncate">
                                    <Icon name={file.name.endsWith('.js') ? 'CommandLineIcon' : file.name.endsWith('.html') ? 'GlobeAltIcon' : 'DocumentIcon'} className="w-3.5 h-3.5 opacity-60" />
                                    <span className="truncate">{file.name}</span>
                                </div>
                                <button
                                    onClick={(e) => { e.stopPropagation(); deleteFile(file.id); }}
                                    className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition-opacity"
                                >
                                    <Icon name="XMarkIcon" className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Editor Area */}
                <div className="flex-1 overflow-auto relative font-mono text-sm bg-[#1e1e1e]">
                    <Editor
                        value={activeFile.content}
                        onValueChange={updateActiveFileContent}
                        highlight={code => {
                            const lang = activeFile.name.endsWith('.html') ? languages.html : activeFile.name.endsWith('.css') ? languages.css : languages.js;
                            const langName = activeFile.name.endsWith('.html') ? 'html' : activeFile.name.endsWith('.css') ? 'css' : 'javascript';
                            return highlight(code, lang, langName);
                        }}
                        padding={20}
                        style={{
                            fontFamily: '"Fira Code", "Fira Mono", monospace',
                            fontSize: 14,
                            backgroundColor: '#1e1e1e',
                            minHeight: '100%'
                        }}
                        className="min-h-full"
                    />
                </div>
            </div>

            {/* Status Bar */}
            <div className="h-6 bg-[#007acc] text-white text-xs flex items-center px-4 justify-between">
                <div className="flex gap-4">
                    <span>Ln {activeFile.content.substring(0, activeFile.content.length).split('\n').length}, Col 1</span>
                    <span>UTF-8</span>
                </div>
                <div>
                    <span>JavaScript</span>
                </div>
            </div>
        </div>
    );
};
