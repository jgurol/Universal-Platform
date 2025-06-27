
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger, AlertDialogFooter } from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, FileText } from "lucide-react";
import { useAgentAgreementTemplates, AgentAgreementTemplate } from "@/hooks/useAgentAgreementTemplates";

export const AgentAgreementTemplatesManagement = () => {
  const { templates, isLoading, addTemplate, updateTemplate, deleteTemplate } = useAgentAgreementTemplates();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<AgentAgreementTemplate | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    content: '',
    is_default: false
  });

  const resetForm = () => {
    setFormData({
      name: '',
      content: '',
      is_default: false
    });
  };

  const handleAdd = async () => {
    if (!formData.name.trim() || !formData.content.trim()) {
      return;
    }

    await addTemplate(formData);
    resetForm();
    setIsAddDialogOpen(false);
  };

  const handleEdit = (template: AgentAgreementTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      content: template.content,
      is_default: template.is_default
    });
  };

  const handleUpdate = async () => {
    if (!editingTemplate || !formData.name.trim() || !formData.content.trim()) {
      return;
    }

    await updateTemplate(editingTemplate.id, formData);
    setEditingTemplate(null);
    resetForm();
  };

  const handleDelete = async (id: string) => {
    await deleteTemplate(id);
  };

  const handleDialogClose = () => {
    setIsAddDialogOpen(false);
    setEditingTemplate(null);
    resetForm();
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <p className="text-muted-foreground">Loading agent agreement templates...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Agent Agreement Templates
        </CardTitle>
        <CardDescription>
          Manage templates for agent agreements. Create customizable templates that can be used when sending agent agreement emails.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">Templates</h3>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Template
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px]">
              <DialogHeader>
                <DialogTitle>Add Agent Agreement Template</DialogTitle>
                <DialogDescription>
                  Create a new template for agent agreements. This template will be used in the agreement form.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Template Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter template name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="content">Agreement Content</Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="Enter the agreement terms and conditions..."
                    rows={12}
                    className="min-h-[300px]"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_default"
                    checked={formData.is_default}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_default: !!checked })}
                  />
                  <Label htmlFor="is_default">Set as default template</Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={handleDialogClose}>
                  Cancel
                </Button>
                <Button onClick={handleAdd}>
                  Add Template
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-4">
          {templates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No agent agreement templates found.</p>
              <p className="text-sm">Create your first template to get started.</p>
            </div>
          ) : (
            templates.map((template) => (
              <div key={template.id} className="border rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{template.name}</h4>
                    {template.is_default && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        Default
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Dialog open={editingTemplate?.id === template.id} onOpenChange={(open) => {
                      if (!open) {
                        setEditingTemplate(null);
                        resetForm();
                      }
                    }}>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(template)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[700px]">
                        <DialogHeader>
                          <DialogTitle>Edit Agent Agreement Template</DialogTitle>
                          <DialogDescription>
                            Update the agent agreement template.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="edit-name">Template Name</Label>
                            <Input
                              id="edit-name"
                              value={formData.name}
                              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                              placeholder="Enter template name"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="edit-content">Agreement Content</Label>
                            <Textarea
                              id="edit-content"
                              value={formData.content}
                              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                              placeholder="Enter the agreement terms and conditions..."
                              rows={12}
                              className="min-h-[300px]"
                            />
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="edit-is_default"
                              checked={formData.is_default}
                              onCheckedChange={(checked) => setFormData({ ...formData, is_default: !!checked })}
                            />
                            <Label htmlFor="edit-is_default">Set as default template</Label>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={handleDialogClose}>
                            Cancel
                          </Button>
                          <Button onClick={handleUpdate}>
                            Update Template
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Template</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{template.name}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(template.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {template.content.substring(0, 200)}...
                </p>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
