
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { FolderIcon, FileIcon, Upload, Plus, ArrowLeft, Trash2, Eye, EyeOff } from "lucide-react";
import { useVendorAttachments } from "@/hooks/useVendorAttachments";
import { VendorFolder, VendorAttachment } from "@/types/vendorAttachments";
import { Vendor } from "@/types/vendors";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";

interface VendorAttachmentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendor: Vendor | null;
}

export const VendorAttachmentsDialog = ({ open, onOpenChange, vendor }: VendorAttachmentsDialogProps) => {
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState("");
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);
  const [isPublicUpload, setIsPublicUpload] = useState(false);
  
  const { folders, attachments, isLoading, createFolder, uploadFile, moveAttachment, deleteAttachment, togglePublicStatus } = useVendorAttachments(vendor?.id);
  const { toast } = useToast();
  const { isAdmin } = useAuth();

  const currentFolder = folders.find(f => f.id === currentFolderId);
  const currentFolders = folders.filter(f => f.parent_folder_id === currentFolderId);
  const currentAttachments = attachments.filter(a => a.folder_id === currentFolderId);

  // Function to count attachments in a folder (including subfolders)
  const countAttachmentsInFolder = (folderId: string): number => {
    const directAttachments = attachments.filter(a => a.folder_id === folderId).length;
    const subfolders = folders.filter(f => f.parent_folder_id === folderId);
    const subfolderAttachments = subfolders.reduce((count, subfolder) => 
      count + countAttachmentsInFolder(subfolder.id), 0
    );
    return directAttachments + subfolderAttachments;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!isAdmin) return; // Prevent non-admins from uploading
    
    const files = Array.from(event.target.files || []);
    for (const file of files) {
      await uploadFile(file, currentFolderId || undefined, isPublicUpload);
    }
    event.target.value = '';
  };

  const handleCreateFolder = async () => {
    if (!isAdmin || !newFolderName.trim()) return; // Prevent non-admins from creating folders
    
    await createFolder(newFolderName.trim(), currentFolderId || undefined);
    setNewFolderName("");
    setShowNewFolderInput(false);
  };

  const handleDrop = async (e: React.DragEvent, targetFolderId?: string) => {
    e.preventDefault();
    setDragOverFolderId(null);

    if (!isAdmin) return; // Prevent non-admins from using drag & drop

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      for (const file of files) {
        await uploadFile(file, targetFolderId, isPublicUpload);
      }
    } else {
      // Handle moving existing attachments
      const attachmentId = e.dataTransfer.getData('text/plain');
      if (attachmentId) {
        await moveAttachment(attachmentId, targetFolderId);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent, folderId?: string) => {
    if (!isAdmin) return; // Don't allow drag over for non-admins
    e.preventDefault();
    setDragOverFolderId(folderId || null);
  };

  const handleDragLeave = () => {
    setDragOverFolderId(null);
  };

  const handleAttachmentDragStart = (e: React.DragEvent, attachmentId: string) => {
    if (!isAdmin) {
      e.preventDefault();
      return; // Prevent non-admins from dragging attachments
    }
    e.dataTransfer.setData('text/plain', attachmentId);
  };

  const openAttachment = (attachment: VendorAttachment) => {
    window.open(attachment.file_path, '_blank');
  };

  const handleTogglePublicStatus = (attachmentId: string, currentPublicStatus: boolean) => {
    if (!isAdmin) return; // Only admins can toggle public status
    togglePublicStatus(attachmentId, !currentPublicStatus);
  };

  if (!vendor) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            {currentFolder && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setCurrentFolderId(currentFolder.parent_folder_id || null)}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <DialogTitle>
              {vendor.name} - {currentFolder ? currentFolder.name : 'Attachments'}
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Upload and New Folder Controls - Only show for admins */}
          {isAdmin && (
            <div className="flex items-center gap-4 flex-wrap">
              <Button
                onClick={() => document.getElementById('file-upload')?.click()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Files
              </Button>
              <input
                id="file-upload"
                type="file"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={() => setShowNewFolderInput(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                New Folder
              </Button>
              
              {/* Public/Private Toggle for Uploads */}
              <div className="flex items-center space-x-2">
                <Switch
                  id="public-upload"
                  checked={isPublicUpload}
                  onCheckedChange={setIsPublicUpload}
                />
                <Label htmlFor="public-upload" className="text-sm">
                  Make uploads public (visible to agents)
                </Label>
              </div>
            </div>
          )}

          {/* New Folder Input - Only show for admins */}
          {isAdmin && showNewFolderInput && (
            <div className="flex items-center gap-2">
              <Input
                placeholder="Folder name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleCreateFolder()}
              />
              <Button onClick={handleCreateFolder}>Create</Button>
              <Button variant="outline" onClick={() => {
                setShowNewFolderInput(false);
                setNewFolderName("");
              }}>Cancel</Button>
            </div>
          )}

          {/* Drop Zone - Only show for admins */}
          {isAdmin && (
            <div
              className={`border-2 border-dashed rounded-lg p-4 transition-colors ${
                dragOverFolderId === null ? 'border-blue-300 bg-blue-50' : 'border-gray-300'
              }`}
              onDrop={(e) => handleDrop(e, currentFolderId || undefined)}
              onDragOver={(e) => handleDragOver(e)}
              onDragLeave={handleDragLeave}
            >
              <p className="text-center text-gray-500">
                Drop files here to upload to current folder
                {isPublicUpload ? " (will be public)" : " (will be private)"}
              </p>
            </div>
          )}

          {/* Folders Grid */}
          {currentFolders.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {currentFolders.map((folder) => {
                const attachmentCount = countAttachmentsInFolder(folder.id);
                return (
                  <Card
                    key={folder.id}
                    className={`cursor-pointer hover:shadow-md transition-shadow ${
                      dragOverFolderId === folder.id ? 'bg-blue-100 border-blue-300' : ''
                    }`}
                    onClick={() => setCurrentFolderId(folder.id)}
                    onDrop={(e) => handleDrop(e, folder.id)}
                    onDragOver={(e) => handleDragOver(e, folder.id)}
                    onDragLeave={handleDragLeave}
                  >
                    <CardContent className="p-4 text-center relative">
                      {attachmentCount > 0 && (
                        <Badge 
                          variant="secondary" 
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center text-xs bg-blue-600 text-white"
                        >
                          {attachmentCount}
                        </Badge>
                      )}
                      <FolderIcon className="h-12 w-12 mx-auto mb-2 text-blue-600" />
                      <p className="text-sm font-medium truncate">{folder.name}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Attachments Grid */}
          {currentAttachments.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {currentAttachments.map((attachment) => (
                <Card
                  key={attachment.id}
                  className="cursor-pointer hover:shadow-md transition-shadow group"
                  draggable={isAdmin}
                  onDragStart={(e) => handleAttachmentDragStart(e, attachment.id)}
                >
                  <CardContent className="p-4 text-center relative">
                    {isAdmin && (
                      <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTogglePublicStatus(attachment.id, attachment.is_public);
                          }}
                          title={attachment.is_public ? "Make private" : "Make public"}
                        >
                          {attachment.is_public ? (
                            <Eye className="h-3 w-3 text-green-500" />
                          ) : (
                            <EyeOff className="h-3 w-3 text-gray-500" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteAttachment(attachment.id);
                          }}
                        >
                          <Trash2 className="h-3 w-3 text-red-500" />
                        </Button>
                      </div>
                    )}
                    <div onClick={() => openAttachment(attachment)}>
                      <FileIcon className="h-12 w-12 mx-auto mb-2 text-gray-600" />
                      <p className="text-xs font-medium truncate" title={attachment.file_name}>
                        {attachment.file_name}
                      </p>
                      {attachment.file_size && (
                        <p className="text-xs text-gray-500">
                          {(attachment.file_size / 1024).toFixed(1)} KB
                        </p>
                      )}
                      <div className="flex items-center justify-center mt-1">
                        {attachment.is_public ? (
                          <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                            Public
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs bg-gray-50 text-gray-700 border-gray-200">
                            Private
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Empty State */}
          {currentFolders.length === 0 && currentAttachments.length === 0 && !isLoading && (
            <div className="text-center py-8 text-gray-500">
              <FolderIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">No files or folders</p>
              {isAdmin ? (
                <p className="text-sm">Upload files or create folders to get started</p>
              ) : (
                <p className="text-sm">No public files available</p>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
