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

  // Convert markdown to HTML for display - preserve line breaks properly
  const markdownToHtml = (text: string): string => {
    if (!text) return '';
    
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // **bold** to <strong>
      .replace(/\*(.*?)\*/g, '<em>$1</em>') // *italic* to <em>
      .replace(/\n/g, '<br>') // Convert all newlines to br tags
      .replace(/^(.*)$/, '<div>$1</div>'); // Wrap in div instead of p tags
  };

  // Convert HTML back to markdown - simplified and more reliable
  const htmlToMarkdown = (html: string): string => {
    if (!html) return '';
    
    console.log('RichTextEditor - Converting HTML to markdown:', html.substring(0, 200));
    
    // Create a temporary div to handle HTML parsing
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    // Get the text content and manually reconstruct with formatting
    let result = '';
    
    const processNode = (node: Node): string => {
      if (node.nodeType === Node.TEXT_NODE) {
        return node.textContent || '';
      }
      
      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as Element;
        const tagName = element.tagName.toLowerCase();
        
        let content = '';
        for (const child of element.childNodes) {
          content += processNode(child);
        }
        
        switch (tagName) {
          case 'strong':
          case 'b':
            return `**${content}**`;
          case 'em':
          case 'i':
            return `*${content}*`;
          case 'br':
            return '\n';
          case 'div':
            // Add newline after div unless it's the last one
            const nextSibling = element.nextElementSibling;
            return content + (nextSibling ? '\n' : '');
          case 'p':
            return content + '\n\n';
          default:
            return content;
        }
      }
      
      return '';
    };
    
    result = processNode(tempDiv);
    
    // Clean up excessive newlines but preserve intentional ones
    result = result
      .replace(/\n{3,}/g, '\n\n') // Max 2 consecutive newlines
      .replace(/^\n+/, '') // Remove leading newlines
      .replace(/\n+$/, ''); // Remove trailing newlines
    
    console.log('RichTextEditor - Converted markdown:', result.substring(0, 200));
    console.log('RichTextEditor - Newline count:', (result.match(/\n/g) || []).length);
    
    return result;
  };

  // Initialize the editor content
  useEffect(() => {
    if (editorRef.current && value !== undefined) {
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
        console.log('RichTextEditor - Content changed, updating value:', markdownContent.substring(0, 100));
        onChange(markdownContent);
      }
    }
  };

  // Handle Enter key with a more reliable approach
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      
      // Get current selection
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;
      
      const range = selection.getRangeAt(0);
      
      // Insert a line break
      const br = document.createElement('br');
      range.deleteContents();
      range.insertNode(br);
      
      // Move cursor after the br
      range.setStartAfter(br);
      range.setEndAfter(br);
      selection.removeAllRanges();
      selection.addRange(range);
      
      // Trigger input handler to update the markdown
      setTimeout(() => handleInput(), 0);
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
