
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Bold, Italic, Image } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface EnhancedRichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
}

export const EnhancedRichTextEditor: React.FC<EnhancedRichTextEditorProps> = ({
  value,
  onChange,
  placeholder = "Enter description...",
  rows = 6,
  className
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isBoldActive, setIsBoldActive] = useState(false);
  const [isItalicActive, setIsItalicActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  // Convert markdown with image tags to HTML for display
  const markdownToHtml = (text: string): string => {
    if (!text) return '';
    
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // **bold** to <strong>
      .replace(/\*(.*?)\*/g, '<em>$1</em>') // *italic* to <em>
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width: 100px; max-height: 60px; object-fit: cover; border-radius: 4px; margin: 2px;" />') // ![alt](url) to img tag
      .replace(/\n/g, '<br>'); // Convert newlines to br tags
  };

  // Convert HTML back to markdown
  const htmlToMarkdown = (html: string): string => {
    if (!html) return '';
    
    console.log('EnhancedRichTextEditor - Converting HTML to markdown:', html.substring(0, 200));
    
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
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
          case 'img':
            const src = element.getAttribute('src') || '';
            const alt = element.getAttribute('alt') || '';
            return `![${alt}](${src})`;
          case 'div':
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
    
    let result = processNode(tempDiv);
    
    // Clean up excessive newlines
    result = result
      .replace(/\n{3,}/g, '\n\n')
      .replace(/^\n+/, '')
      .replace(/\n+$/, '');
    
    console.log('EnhancedRichTextEditor - Converted markdown:', result.substring(0, 200));
    
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

  // Handle content changes
  const handleInput = () => {
    if (editorRef.current) {
      const htmlContent = editorRef.current.innerHTML;
      const markdownContent = htmlToMarkdown(htmlContent);
      
      if (markdownContent !== value) {
        console.log('EnhancedRichTextEditor - Content changed, updating value:', markdownContent.substring(0, 100));
        onChange(markdownContent);
      }
    }
  };

  // Handle Enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;
      
      const range = selection.getRangeAt(0);
      const br = document.createElement('br');
      range.deleteContents();
      range.insertNode(br);
      
      range.setStartAfter(br);
      range.setEndAfter(br);
      selection.removeAllRanges();
      selection.addRange(range);
      
      setTimeout(() => handleInput(), 0);
    }
  };

  // Update toolbar state
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

  // Handle image upload
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      console.log('[EnhancedRichTextEditor] Uploading image:', { fileName, filePath });

      const { error: uploadError } = await supabase.storage
        .from('quote-item-images')
        .upload(filePath, file);

      if (uploadError) {
        console.error('[EnhancedRichTextEditor] Upload error:', uploadError);
        throw uploadError;
      }

      const { data } = supabase.storage
        .from('quote-item-images')
        .getPublicUrl(filePath);

      console.log('[EnhancedRichTextEditor] Upload successful:', { publicUrl: data.publicUrl, fileName });

      // Insert image at cursor position
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0 && editorRef.current) {
        const range = selection.getRangeAt(0);
        const img = document.createElement('img');
        img.src = data.publicUrl;
        img.alt = file.name;
        img.style.maxWidth = '100px';
        img.style.maxHeight = '60px';
        img.style.objectFit = 'cover';
        img.style.borderRadius = '4px';
        img.style.margin = '2px';
        
        range.deleteContents();
        range.insertNode(img);
        
        // Move cursor after image
        range.setStartAfter(img);
        range.setEndAfter(img);
        selection.removeAllRanges();
        selection.addRange(range);
        
        handleInput();
      }

      toast({
        title: "Success",
        description: "Image uploaded and inserted successfully",
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Error",
        description: "Failed to upload image",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
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
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />

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
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="h-8 w-8 p-0"
        >
          {uploading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
          ) : (
            <Image className="h-4 w-4" />
          )}
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
