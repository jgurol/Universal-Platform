
import React, { useState, useRef, useCallback } from 'react';
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

export const ReactQuillEditor: React.FC<ReactQuillEditorProps> = ({
  value,
  onChange,
  placeholder = "Enter description...",
  className
}) => {
  const quillRef = useRef<ReactQuill>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

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

  function handleImageUpload() {
    fileInputRef.current?.click();
  }

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

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const imageUrl = await uploadImage(file);
    if (imageUrl && quillRef.current) {
      const quill = quillRef.current.getEditor();
      const range = quill.getSelection();
      const index = range ? range.index : quill.getLength();
      
      quill.insertEmbed(index, 'image', imageUrl);
      // Fix: Pass proper RangeStatic object instead of just a number
      quill.setSelection({ index: index + 1, length: 0 });
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Convert Quill's HTML to a format compatible with your existing system
  const handleChange = (content: string) => {
    // Quill gives us clean HTML, but we might want to convert images to markdown format
    // for compatibility with your existing PDF generation system
    let processedContent = content;
    
    // Convert img tags to markdown format for consistency
    processedContent = processedContent.replace(
      /<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*>/g,
      '![$2]($1)'
    );
    
    // Convert other HTML to markdown-like format if needed
    processedContent = processedContent
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

    onChange(processedContent);
  };

  // Convert markdown back to HTML for Quill
  const getHtmlValue = () => {
    if (!value) return '';
    
    return value
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/__(.*?)__/g, '<u>$1</u>')
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width: 120px; max-height: 80px; object-fit: cover; border-radius: 6px; margin: 4px;" />')
      .replace(/\n/g, '<br>');
  };

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
        value={getHtmlValue()}
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
