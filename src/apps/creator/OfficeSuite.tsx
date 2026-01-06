import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { Icon } from '../../components/shared/ui/CommonUI';
import { jsPDF } from 'jspdf';

export const OfficeSuite: React.FC = () => {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Underline,
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
            Link.configure({
                openOnClick: false,
            }),
            Placeholder.configure({
                placeholder: 'Start typing your document here...',
            }),
        ],
        content: `
            <h1>Welcome to the Office Suite</h1>
            <p>This is a modern, high-performance rich text editor built with TipTap.</p>
            <p>Use the toolbar above to format your text, align paragraphs, and more.</p>
        `,
    });

    const exportToPDF = () => {
        if (!editor) return;
        const doc = new jsPDF();
        const text = editor.getText();
        const splitText = doc.splitTextToSize(text, 180);
        doc.text(splitText, 15, 15);
        doc.save('document.pdf');
    };

    if (!editor) {
        return null;
    }

    const ToolbarButton: React.FC<{
        onClick: () => void,
        active?: boolean,
        icon?: string,
        label?: string,
        title?: string
    }> = ({ onClick, active, icon, label, title }) => (
        <button
            onClick={onClick}
            className={`p-1.5 rounded transition-colors ${active ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400' : 'hover:bg-gray-200 dark:hover:bg-[#333] text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
            title={title}
        >
            {icon ? <Icon name={icon} className="w-4 h-4" /> : <span className="font-bold text-sm px-1">{label}</span>}
        </button>
    );

    return (
        <div className="h-full flex flex-col bg-white dark:bg-[#1e1e1e] text-gray-900 dark:text-white">
            {/* Toolbar */}
            <div className="h-12 border-b border-gray-200 dark:border-[#333] flex items-center px-4 gap-2 bg-gray-50 dark:bg-[#252526] sticky top-0 z-20">
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold mr-4">
                    <Icon name="DocumentTextIcon" className="w-5 h-5" />
                    <span>Office Suite</span>
                </div>

                <div className="h-6 w-[1px] bg-gray-300 dark:bg-[#444] mx-2"></div>

                <div className="flex items-center gap-1">
                    <ToolbarButton
                        label="H1"
                        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                        active={editor.isActive('heading', { level: 1 })}
                    />
                    <ToolbarButton
                        label="H2"
                        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                        active={editor.isActive('heading', { level: 2 })}
                    />
                    <div className="h-4 w-[1px] bg-gray-300 dark:bg-[#444] mx-1"></div>
                    <ToolbarButton
                        label="B"
                        onClick={() => editor.chain().focus().toggleBold().run()}
                        active={editor.isActive('bold')}
                        title="Bold"
                    />
                    <ToolbarButton
                        label="I"
                        onClick={() => editor.chain().focus().toggleItalic().run()}
                        active={editor.isActive('italic')}
                        title="Italic"
                    />
                    <ToolbarButton
                        label="U"
                        onClick={() => editor.chain().focus().toggleUnderline().run()}
                        active={editor.isActive('underline')}
                        title="Underline"
                    />
                </div>

                <div className="h-6 w-[1px] bg-gray-300 dark:bg-[#444] mx-2"></div>

                <div className="flex items-center gap-1">
                    <ToolbarButton
                        icon="Bars3BottomLeft"
                        onClick={() => editor.chain().focus().setTextAlign('left').run()}
                        active={editor.isActive({ textAlign: 'left' })}
                    />
                    <ToolbarButton
                        icon="Bars3"
                        onClick={() => editor.chain().focus().setTextAlign('center').run()}
                        active={editor.isActive({ textAlign: 'center' })}
                    />
                    <ToolbarButton
                        icon="Bars3BottomRight"
                        onClick={() => editor.chain().focus().setTextAlign('right').run()}
                        active={editor.isActive({ textAlign: 'right' })}
                    />
                </div>

                <div className="h-6 w-[1px] bg-gray-300 dark:bg-[#444] mx-2"></div>

                <div className="flex items-center gap-1">
                    <ToolbarButton
                        icon="ListBullet"
                        onClick={() => editor.chain().focus().toggleBulletList().run()}
                        active={editor.isActive('bulletList')}
                    />
                    <ToolbarButton
                        label="1."
                        onClick={() => editor.chain().focus().toggleOrderedList().run()}
                        active={editor.isActive('orderedList')}
                    />
                </div>

                <div className="flex-1"></div>

                <button
                    onClick={exportToPDF}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-xs font-bold transition-colors shadow-sm ml-4"
                >
                    <Icon name="ArrowDownTrayIcon" className="w-4 h-4" />
                    Export PDF
                </button>
            </div>

            {/* Editor Area */}
            <div className="flex-1 overflow-auto bg-gray-100 dark:bg-[#121212] p-8 flex justify-center custom-tiptap">
                <EditorContent
                    editor={editor}
                    className="w-full max-w-[816px] min-h-[1056px] bg-white dark:bg-white text-black p-[96px] shadow-lg outline-none cursor-text mb-20"
                />
            </div>

            {/* Status Bar */}
            <div className="h-6 bg-gray-200 dark:bg-[#007acc] text-gray-600 dark:text-white text-xs flex items-center px-4 justify-between shrink-0">
                <div className="flex gap-4 font-medium">
                    <span>Page 1 of 1</span>
                    <span>{editor.storage.characterCount?.characters?.() || editor.getText().length} characters</span>
                    <span>{editor.storage.characterCount?.words?.() || editor.getText().split(/\s+/).filter(Boolean).length} words</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                    <span className="font-semibold uppercase tracking-tighter text-[9px]">Live Storage Active</span>
                </div>
            </div>

            <style>{`
                .custom-tiptap .ProseMirror {
                    outline: none !important;
                    min-height: 1056px;
                }
                .custom-tiptap .ProseMirror h1 { font-size: 2.5em; font-weight: bold; margin-bottom: 0.5em; }
                .custom-tiptap .ProseMirror h2 { font-size: 1.8em; font-weight: bold; margin-bottom: 0.4em; }
                .custom-tiptap .ProseMirror p { margin-bottom: 1em; }
                .custom-tiptap .ProseMirror ul { list-style-type: disc; padding-left: 1.5em; margin-bottom: 1em; }
                .custom-tiptap .ProseMirror ol { list-style-type: decimal; padding-left: 1.5em; margin-bottom: 1em; }
                .custom-tiptap .ProseMirror blockquote { border-left: 3px solid #ccc; padding-left: 1em; font-style: italic; }
            `}</style>
        </div>
    );
};
