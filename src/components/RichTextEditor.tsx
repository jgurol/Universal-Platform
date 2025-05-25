
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Bold, Italic } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = "Enter text...",
  rows = 6,
  className
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isBoldActive, setIsBoldActive] = useState(false);
  const [isItalicActive, setIsItalicActive] = useState(false);

  // Convert markdown-style format to HTML for display
  const markdownToHtml = (text: string): string => {
    if (!text) return '';
    
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // **bold** to <strong>
      .replace(/\*(.*?)\*/g, '<em>$1</em>') // *italic* to <em>
      .replace(/\n\n/g, '</p><p>') // Double newlines to paragraph breaks
      .replace(/\n/g, '<br>') // Single newlines to line breaks
      .replace(/^(.*)$/, '<p>$1</p>'); // Wrap in paragraph tags
  };

  // Convert HTML back to markdown-style format
  const htmlToMarkdown = (html: string): string => {
    if (!html) return '';
    
    return html
      .replace(/<p>/g, '') // Remove opening p tags
      .replace(/<\/p>/g, '\n\n') // Convert closing p tags to double newlines
      .replace(/<br\s*\/?>/gi, '\n') // Convert br tags to newlines
      .replace(/<strong>(.*?)<\/strong>/g, '**$1**') // <strong> to **bold**
      .replace(/<b>(.*?)<\/b>/g, '**$1**') // <b> to **bold**
      .replace(/<em>(.*?)<\/em>/g, '*$1*') // <em> to *italic*
      .replace(/<i>(.*?)<\/i>/g, '*$1*') // <i> to *italic*
      .replace(/\n\n+/g, '\n\n') // Normalize multiple newlines to double
      .trim();
  };

  // Initialize the editor content
  useEffect(() => {
    if (editorRef.current) {
      const htmlContent = markdownToHtml(value);
      if (editorRef.current.innerHTML !== htmlContent) {
        editorRef.current.innerHTML = htmlContent;
      }
    }
  }, [value]);

  // Handle content changes
  const handleInput = () => {
    if (editorRef.current) {
      const htmlContent = editorRef.current.innerHTML;
      const markdownContent = htmlToMarkdown(htmlContent);
      onChange(markdownContent);
    }
  };

  // Update toolbar state based on cursor position
  const updateToolbarState = () => {
    setIsBoldActive(document.queryCommandState('bold'));
    setIsItalicActive(document.queryCommandState('italic'));
  };

  // Handle toolbar button clicks
  const handleBold = () => {
    document.execCommand('bold', false, undefined);
    updateToolbarState();
    handleInput(); // Update the markdown content
    editorRef.current?.focus();
  };

  const handleItalic = () => {
    document.execCommand('italic', false, undefined);
    updateToolbarState();
    handleInput(); // Update the markdown content
    editorRef.current?.focus();
  };

  // Handle key events for toolbar state updates
  const handleKeyUp = () => {
    updateToolbarState();
    handleInput(); // Update the markdown content
  };

  const handleMouseUp = () => {
    updateToolbarState();
  };

  // Check if editor is empty to show placeholder
  const showPlaceholder = !value || value.trim() === '';

  return (
    <div className={cn("border rounded-md", className)}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b bg-gray-50">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleBold}
          className={cn(
            "h-8 w-8 p-0",
            isBoldActive && "bg-gray-200"
          )}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleItalic}
          className={cn(
            "h-8 w-8 p-0",
            isItalicActive && "bg-gray-200"
          )}
        >
          <Italic className="h-4 w-4" />
        </Button>
      </div>

      {/* Editor */}
      <div className="relative">
        {showPlaceholder && (
          <div 
            className="absolute top-3 left-3 text-gray-400 pointer-events-none select-none"
            style={{ minHeight: `${rows * 24}px` }}
          >
            {placeholder}
          </div>
        )}
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          onKeyUp={handleKeyUp}
          onMouseUp={handleMouseUp}
          className={cn(
            "p-3 min-h-[150px] focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-b-md",
            showPlaceholder && "text-transparent"
          )}
          style={{ minHeight: `${rows * 24}px` }}
          suppressContentEditableWarning={true}
        />
      </div>
    </div>
  );
};
