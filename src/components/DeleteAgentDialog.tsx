
import { useState } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { Client } from "@/types/index";

interface DeleteAgentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agentToDelete: Client | null;
  availableAgents: Client[];
  onConfirmDelete: (reassignToAgentId?: string) => void;
  associatedUsersCount: number;
}

export const DeleteAgentDialog = ({
  open,
  onOpenChange,
  agentToDelete,
  availableAgents,
  onConfirmDelete,
  associatedUsersCount
}: DeleteAgentDialogProps) => {
  const [selectedReassignAgent, setSelectedReassignAgent] = useState<string>("");
  const [deleteAction, setDeleteAction] = useState<"destroy" | "reassign">("destroy");

  const handleConfirm = () => {
    if (deleteAction === "reassign" && selectedReassignAgent) {
      onConfirmDelete(selectedReassignAgent);
    } else {
      onConfirmDelete();
    }
    onOpenChange(false);
    setSelectedReassignAgent("");
    setDeleteAction("destroy");
  };

  const handleCancel = () => {
    onOpenChange(false);
    setSelectedReassignAgent("");
    setDeleteAction("destroy");
  };

  if (!agentToDelete) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-[500px]">
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <AlertDialogTitle>Delete Salesperson</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-left space-y-3">
            <p>
              You are about to delete <strong>{agentToDelete.name}</strong>.
            </p>
            {associatedUsersCount > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                <p className="text-yellow-800 font-medium">
                  ⚠️ Warning: This salesperson has {associatedUsersCount} associated user(s).
                </p>
                <p className="text-yellow-700 text-sm mt-1">
                  What would you like to do with the associated users?
                </p>
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {associatedUsersCount > 0 && (
          <div className="space-y-4">
            <div className="space-y-3">
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="deleteAction"
                  value="destroy"
                  checked={deleteAction === "destroy"}
                  onChange={() => setDeleteAction("destroy")}
                  className="text-red-600"
                />
                <span className="text-sm">Remove all associations (users will become unassociated)</span>
              </label>
              
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="deleteAction"
                  value="reassign"
                  checked={deleteAction === "reassign"}
                  onChange={() => setDeleteAction("reassign")}
                  className="text-blue-600"
                />
                <span className="text-sm">Reassign users to another salesperson</span>
              </label>
            </div>

            {deleteAction === "reassign" && (
              <div className="ml-6">
                <label className="text-sm font-medium text-gray-700">
                  Select salesperson to reassign users to:
                </label>
                <Select value={selectedReassignAgent} onValueChange={setSelectedReassignAgent}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Choose a salesperson" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableAgents
                      .filter(agent => agent.id !== agentToDelete.id)
                      .map((agent) => (
                        <SelectItem key={agent.id} value={agent.id}>
                          {agent.name} ({agent.companyName || 'No Company'})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={deleteAction === "reassign" && !selectedReassignAgent}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Delete Salesperson
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
