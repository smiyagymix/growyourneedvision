import React, { useState, useEffect, useRef } from 'react';

interface RichTextEditorProps {
  initialValue: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  style: React.CSSProperties;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({ initialValue, onChange, onBlur, style }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.focus();
      // Select all text
      const range = document.createRange();
      range.selectNodeContents(ref.current);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
  }, []);

  return (
    <div
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      onBlur={(e) => {
        onChange(e.currentTarget.innerText);
        onBlur();
      }}
      style={{
        ...style,
        outline: '2px solid #3b82f6',
        minWidth: '10px',
        minHeight: '1em',
        cursor: 'text',
        pointerEvents: 'auto'
      }}
    >
      {initialValue}
    </div>
  );
};
