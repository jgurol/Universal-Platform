
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

  // Convert markdown to HTML for display
  const markdownToHtml = (text: string): string => {
    if (!text) return '';
    
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // **bold** to <strong>
      .replace(/\*(.*?)\*/g, '<em>$1</em>') // *italic* to <em>
      .replace(/\n\n/g, '</p><p>') // Double newlines to paragraph breaks
      .replace(/\n/g, '<br>') // Single newlines to line breaks
      .replace(/^(.*)$/, '<p>$1</p>'); // Wrap in paragraph tags
  };

  // Convert HTML back to markdown - enhanced to better preserve line breaks
  const htmlToMarkdown = (html: string): string => {
    if (!html) return '';
    
    console.log('RichTextEditor - Converting HTML to markdown:', html.substring(0, 200));
    
    let markdown = html
      // Handle different types of line breaks and paragraphs
      .replace(/<div><br><\/div>/gi, '\n') // Empty div with br
      .replace(/<div><\/div>/gi, '\n') // Empty divs
      .replace(/<div[^>]*>/gi, '\n') // Div starts
      .replace(/<\/div>/gi, '') // Div ends
      .replace(/<p[^>]*>/gi, '') // Remove paragraph opening tags
      .replace(/<\/p>/gi, '\n\n') // Convert paragraph closes to double newlines
      .replace(/<br\s*\/?>/gi, '\n') // Convert line breaks to actual newlines
      // Convert formatting
      .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
      .replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
      .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
      .replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*')
      // Remove any remaining HTML tags
      .replace(/<[^>]*>/g, '')
      // Clean up excessive newlines but preserve intentional ones
      .replace(/\n{3,}/g, '\n\n') // Max 2 consecutive newlines
      .replace(/^\n+/, '') // Remove leading newlines
      .replace(/\n+$/, ''); // Remove trailing newlines
    
    // Decode HTML entities
    const div = document.createElement('div');
    div.innerHTML = markdown;
    const decodedMarkdown = div.textContent || div.innerText || markdown;
    
    console.log('RichTextEditor - Converted markdown:', decodedMarkdown.substring(0, 200));
    console.log('RichTextEditor - Newline count:', (decodedMarkdown.match(/\n/g) || []).length);
    
    return decodedMarkdown;
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

  // Handle content changes and convert to markdown
  const handleInput = () => {
    if (editorRef.current) {
      const htmlContent = editorRef.current.innerHTML;
      const markdownContent = htmlToMarkdown(htmlContent);
      
      // Only call onChange if the content actually changed
      if (markdownContent !== value) {
        onChange(markdownContent);
      }
    }
  };

  // Handle Enter key to ensure proper line breaks
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        // Shift+Enter should create a line break
        e.preventDefault();
        document.execCommand('insertHTML', false, '<br><br>');
        handleInput();
      } else {
        // Regular Enter should create a paragraph break
        e.preventDefault();
        document.execCommand('insertHTML', false, '<br><br>');
        handleInput();
      }
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
    handleInput();
    editorRef.current?.focus();
  };

  const handleItalic = () => {
    document.execCommand('italic', false, undefined);
    updateToolbarState();
    handleInput();
    editorRef.current?.focus();
  };

  // Handle key events for toolbar state updates
  const handleKeyUp = () => {
    updateToolbarState();
    handleInput();
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
          onKeyDown={handleKeyDown}
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
