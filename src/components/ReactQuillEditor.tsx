
import React, { useState, useRef, useCallback, useEffect } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Button } from '@/components/ui/button';
import { Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
  const [isInitialized, setIsInitialized] = useState(false);
  const [imageResizeDialog, setImageResizeDialog] = useState<{
    open: boolean;
    element: HTMLImageElement | null;
    width: string;
    height: string;
  }>({
    open: false,
    element: null,
    width: '',
    height: ''
  });
  const { toast } = useToast();

  // Initialize editor content when component mounts or value prop changes
  useEffect(() => {
    if (!isInitialized) {
      const htmlContent = convertMarkdownToHtml(value);
      setInternalValue(htmlContent);
      setEditorReady(true);
      setIsInitialized(true);
    }
  }, [value, isInitialized]);

  // Add event listener for image double-clicks
  useEffect(() => {
    if (!editorReady || !quillRef.current) return;

    const quill = quillRef.current.getEditor();
    const editorElement = quill.container;

    const handleImageDoubleClick = (event: Event) => {
      const target = event.target as HTMLElement;
      if (target.tagName === 'IMG') {
        const img = target as HTMLImageElement;
        const currentWidth = img.style.width || img.width.toString() || '300';
        const currentHeight = img.style.height || img.height.toString() || 'auto';
        
        setImageResizeDialog({
          open: true,
          element: img,
          width: currentWidth.replace('px', ''),
          height: currentHeight === 'auto' ? '' : currentHeight.replace('px', '')
        });
      }
    };

    editorElement.addEventListener('dblclick', handleImageDoubleClick);

    return () => {
      editorElement.removeEventListener('dblclick', handleImageDoubleClick);
    };
  }, [editorReady]);

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
    console.log('[ReactQuillEditor] Starting image upload...');

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      console.log('[ReactQuillEditor] Uploading to Supabase storage...');
      const { error: uploadError } = await supabase.storage
        .from('quote-item-images')
        .upload(filePath, file);

      if (uploadError) {
        console.error('[ReactQuillEditor] Upload error:', uploadError);
        throw uploadError;
      }

      const { data } = supabase.storage
        .from('quote-item-images')
        .getPublicUrl(filePath);

      console.log('[ReactQuillEditor] Image uploaded successfully:', data.publicUrl);
      
      toast({
        title: "Success",
        description: "Image uploaded successfully",
      });

      return data.publicUrl;
    } catch (error) {
      console.error('[ReactQuillEditor] Error uploading image:', error);
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
    console.log('[ReactQuillEditor] Image upload button clicked');
    fileInputRef.current?.click();
  }, []);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      console.log('[ReactQuillEditor] No file selected');
      return;
    }

    console.log('[ReactQuillEditor] File selected:', file.name);

    if (!quillRef.current) {
      console.error('[ReactQuillEditor] Quill ref not available');
      return;
    }

    try {
      const imageUrl = await uploadImage(file);
      if (imageUrl) {
        console.log('[ReactQuillEditor] Inserting image into editor:', imageUrl);
        
        const quill = quillRef.current.getEditor();
        if (quill) {
          // Get current selection or insert at the end
          const range = quill.getSelection();
          const index = range ? range.index : quill.getLength();
          
          // Insert the image
          quill.insertEmbed(index, 'image', imageUrl);
          
          // Move cursor after the image
          quill.setSelection(index + 1, 0);
          
          console.log('[ReactQuillEditor] Image inserted successfully');
        } else {
          console.error('[ReactQuillEditor] Could not get Quill editor instance');
        }
      }
    } catch (error) {
      console.error('[ReactQuillEditor] Error in handleFileSelect:', error);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleChange = useCallback((content: string) => {
    console.log('[ReactQuillEditor] Content changed, length:', content.length);
    setInternalValue(content);
    
    // Debounce the onChange to prevent excessive calls
    const timeoutId = setTimeout(() => {
      const markdownContent = convertHtmlToMarkdown(content);
      onChange(markdownContent);
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [onChange]);

  const handleImageResize = () => {
    if (!imageResizeDialog.element) return;

    const { element, width, height } = imageResizeDialog;
    
    // Apply new dimensions
    if (width) {
      element.style.width = `${width}px`;
    }
    if (height) {
      element.style.height = `${height}px`;
    } else {
      element.style.height = 'auto';
    }

    // Trigger content update
    if (quillRef.current) {
      const quill = quillRef.current.getEditor();
      const content = quill.root.innerHTML;
      setInternalValue(content);
      const markdownContent = convertHtmlToMarkdown(content);
      onChange(markdownContent);
    }

    setImageResizeDialog({ open: false, element: null, width: '', height: '' });
    
    toast({
      title: "Success",
      description: "Image resized successfully",
    });
  };

  // Custom toolbar configuration with safer image handler
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
    <>
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

      {/* Image Resize Dialog */}
      <Dialog open={imageResizeDialog.open} onOpenChange={(open) => setImageResizeDialog(prev => ({ ...prev, open }))}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Resize Image</DialogTitle>
            <DialogDescription>
              Set custom width and height for the image. Leave height empty for auto-sizing.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="width" className="text-right">
                Width (px)
              </Label>
              <Input
                id="width"
                type="number"
                value={imageResizeDialog.width}
                onChange={(e) => setImageResizeDialog(prev => ({ ...prev, width: e.target.value }))}
                className="col-span-3"
                placeholder="300"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="height" className="text-right">
                Height (px)
              </Label>
              <Input
                id="height"
                type="number"
                value={imageResizeDialog.height}
                onChange={(e) => setImageResizeDialog(prev => ({ ...prev, height: e.target.value }))}
                className="col-span-3"
                placeholder="Auto"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setImageResizeDialog({ open: false, element: null, width: '', height: '' })}>
              Cancel
            </Button>
            <Button onClick={handleImageResize}>
              Apply Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
