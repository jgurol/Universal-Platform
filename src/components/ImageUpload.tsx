
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Upload, X, Image } from "lucide-react";

interface ImageUploadProps {
  onImageUploaded: (imageUrl: string, imageName: string) => void;
  currentImageUrl?: string;
  currentImageName?: string;
  onImageRemoved: () => void;
}

export const ImageUpload = ({ 
  onImageUploaded, 
  currentImageUrl, 
  currentImageName, 
  onImageRemoved 
}: ImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
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

      console.log('[ImageUpload] Uploading file:', { fileName, filePath });

      const { error: uploadError } = await supabase.storage
        .from('quote-item-images')
        .upload(filePath, file);

      if (uploadError) {
        console.error('[ImageUpload] Upload error:', uploadError);
        throw uploadError;
      }

      const { data } = supabase.storage
        .from('quote-item-images')
        .getPublicUrl(filePath);

      console.log('[ImageUpload] Upload successful:', { publicUrl: data.publicUrl, fileName });

      onImageUploaded(data.publicUrl, fileName);

      toast({
        title: "Success",
        description: "Image uploaded successfully",
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

  const handleRemoveImage = async () => {
    if (currentImageName) {
      try {
        console.log('[ImageUpload] Removing image:', currentImageName);
        await supabase.storage
          .from('quote-item-images')
          .remove([currentImageName]);
      } catch (error) {
        console.error('Error removing image:', error);
      }
    }
    onImageRemoved();
  };

  console.log('[ImageUpload] Current image state:', { currentImageUrl, currentImageName });

  return (
    <div className="space-y-2">
      <Input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
      
      {currentImageUrl ? (
        <div className="relative group">
          <img
            src={currentImageUrl}
            alt="Quote item"
            className="w-20 h-20 object-cover rounded border"
            onError={(e) => {
              console.error('[ImageUpload] Image failed to load:', currentImageUrl);
              e.currentTarget.style.display = 'none';
            }}
            onLoad={() => {
              console.log('[ImageUpload] Image loaded successfully:', currentImageUrl);
            }}
          />
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="absolute -top-2 -right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleRemoveImage}
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="h-20 w-20 border-dashed"
        >
          {uploading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
          ) : (
            <div className="flex flex-col items-center gap-1">
              <Image className="w-4 h-4" />
              <span className="text-xs">Add Image</span>
            </div>
          )}
        </Button>
      )}
    </div>
  );
};
