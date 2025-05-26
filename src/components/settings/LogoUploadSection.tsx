
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Upload, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useSystemSettings } from "@/context/SystemSettingsContext";

export const LogoUploadSection: React.FC = () => {
  const { logoUrl, setLogoUrl, loading, setLoading } = useSystemSettings();
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const { toast } = useToast();

  const handleLogoUpload = async () => {
    if (!logoFile) {
      toast({
        title: "No file selected",
        description: "Please select a logo file to upload",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64String = e.target?.result as string;
        
        const { error } = await supabase
          .from('system_settings')
          .upsert({
            setting_key: 'company_logo_url',
            setting_value: base64String,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'setting_key'
          });

        if (error) throw error;

        setLogoUrl(base64String);
        toast({
          title: "Logo uploaded",
          description: "Company logo has been saved successfully",
        });
        setLogoFile(null);
        setLoading(false);
      };
      
      reader.onerror = () => {
        toast({
          title: "Error reading file",
          description: "Failed to read the selected file",
          variant: "destructive",
        });
        setLoading(false);
      };
      
      reader.readAsDataURL(logoFile);
    } catch (error: any) {
      toast({
        title: "Error uploading logo",
        description: error.message,
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const handleRemoveLogo = async () => {
    try {
      const { error } = await supabase
        .from('system_settings')
        .upsert({
          setting_key: 'company_logo_url',
          setting_value: '',
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'setting_key'
        });

      if (error) throw error;

      setLogoUrl("");
      setLogoFile(null);
      toast({
        title: "Logo removed",
        description: "Company logo has been removed",
      });
    } catch (error: any) {
      toast({
        title: "Error removing logo",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Company Logo
        </CardTitle>
        <CardDescription>
          Upload a company logo to be displayed on quote PDFs
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {logoUrl ? (
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <img src={logoUrl} alt="Company Logo" className="h-16 w-auto object-contain border rounded" />
              <div className="flex flex-col gap-2">
                <p className="text-sm text-gray-600">Current logo</p>
                <Button variant="outline" size="sm" onClick={handleRemoveLogo}>
                  <X className="h-4 w-4 mr-2" />
                  Remove Logo
                </Button>
              </div>
            </div>
            <Separator />
          </div>
        ) : null}
        
        <div className="space-y-3">
          <Label htmlFor="logoUpload">Upload New Logo</Label>
          <Input
            id="logoUpload"
            type="file"
            accept="image/*"
            onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
            className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          <p className="text-xs text-gray-500">
            Recommended: PNG or JPG format, max 2MB. Logo will be displayed in the top-left corner of quote PDFs.
          </p>
          <Button onClick={handleLogoUpload} disabled={loading || !logoFile}>
            <Upload className="h-4 w-4 mr-2" />
            {loading ? "Uploading..." : "Upload Logo"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
