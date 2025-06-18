
import React, { useState, useRef, useCallback, useEffect } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Button } from '@/components/ui/button';
import { Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface ReactQuillEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

// Move conversion functions outside component to prevent recreation
const convertMarkdownToHtml = (markdownContent: string): string => {
  if (!markdownContent) return '';
  
  return markdownContent
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/__(.*?)__/g, '<u>$1</u>')
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width: 300px; height: auto;" />')
    .replace(/\n/g, '<br>');
};

const convertHtmlToMarkdown = (htmlContent: string): string => {
  if (!htmlContent) return '';
  
  let markdownContent = htmlContent;
  
  // Convert images to markdown format
  markdownContent = markdownContent.replace(
    /<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*>/g,
    '![$2]($1)'
  );
  
  // Convert other HTML to markdown
  markdownContent = markdownContent
    .replace(/<strong>(.*?)<\/strong>/g, '**$1**')
    .replace(/<em>(.*?)<\/em>/g, '*$1*')
    .replace(/<u>(.*?)<\/u>/g, '__$1__')
    .replace(/<br\s*\/?>/g, '\n')
    .replace(/<\/p><p>/g, '\n\n')
    .replace(/<p>/g, '')
    .replace(/<\/p>/g, '')
    .replace(/<ol><li>/g, '\n1. ')
    .replace(/<ul><li>/g, '\n- ')
    .replace(/<\/li><li>/g, '\n- ')
    .replace(/<\/li><\/[ou]l>/g, '')
    .replace(/<\/li>/g, '')
    .trim();

  return markdownContent;
};

export const ReactQuillEditor: React.FC<ReactQuillEditorProps> = ({
  value,
  onChange,
  placeholder = "Enter description...",
  className
}) => {
  const quillRef = useRef<ReactQuill>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [editorReady, setEditorReady] = useState(false);
  const [internalValue, setInternalValue] = useState('');
  const { toast } = useToast();

  // Initialize editor content when component mounts or value prop changes
  useEffect(() => {
    const htmlContent = convertMarkdownToHtml(value);
    setInternalValue(htmlContent);
    setEditorReady(true);
  }, [value]);

  const uploadImage = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive"
      });
      return null;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive"
      });
      return null;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('quote-item-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('quote-item-images')
        .getPublicUrl(filePath);

      toast({
        title: "Success",
        description: "Image uploaded successfully",
      });

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Error",
        description: "Failed to upload image",
        variant: "destructive"
      });
      return null;
    } finally {
      setUploading(false);
    }
  }, [toast]);

  const handleImageUpload = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !quillRef.current) return;

    const imageUrl = await uploadImage(file);
    if (imageUrl) {
      const quill = quillRef.current.getEditor();
      if (quill) {
        const range = quill.getSelection();
        const index = range ? range.index : quill.getLength();
        
        quill.insertEmbed(index, 'image', imageUrl);
        quill.setSelection(index + 1, 0);
      }
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleChange = useCallback((content: string) => {
    setInternalValue(content);
    const markdownContent = convertHtmlToMarkdown(content);
    onChange(markdownContent);
  }, [onChange]);

  // Custom toolbar configuration
  const modules = {
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline'],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        ['link', 'image'],
        ['clean']
      ],
      handlers: {
        image: handleImageUpload
      }
    }
  };

  const formats = [
    'header',
    'bold', 'italic', 'underline',
    'color', 'background',
    'list', 'bullet',
    'link', 'image'
  ];

  if (!editorReady) {
    return (
      <div className={cn("border rounded-lg bg-white p-4", className)}>
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
          <span className="text-sm text-gray-600">Loading editor...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("border rounded-lg bg-white", className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
      
      {uploading && (
        <div className="flex items-center justify-center p-2 bg-blue-50 border-b">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
          <span className="text-sm text-blue-600">Uploading image...</span>
        </div>
      )}
      
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={internalValue}
        onChange={handleChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        style={{
          minHeight: '180px'
        }}
      />
    </div>
  );
};
