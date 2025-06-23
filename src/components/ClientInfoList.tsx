import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClientInfo } from "@/types/index";
import { Pencil, Save, X, Building } from "lucide-react";

interface ClientInfoListProps {
  clientInfos: ClientInfo[];
  onUpdateClientInfo: (clientInfo: ClientInfo) => Promise<void>;
  agentMapping: Record<string, string>;
}

export const ClientInfoList = ({ 
  clientInfos, 
  onUpdateClientInfo,
  agentMapping
}: ClientInfoListProps) => {
  const [editingClientInfoId, setEditingClientInfoId] = useState<string | null>(null);
  const [editedCompanyName, setEditedCompanyName] = useState("");
  const [editedNotes, setEditedNotes] = useState("");
  const [editedRevioId, setEditedRevioId] = useState("");
  const [editedAgentId, setEditedAgentId] = useState("");

  const startEditing = (clientInfo: ClientInfo) => {
    setEditingClientInfoId(clientInfo.id);
    setEditedCompanyName(clientInfo.company_name);
    setEditedNotes(clientInfo.notes || "");
    setEditedRevioId(clientInfo.revio_id || "");
    setEditedAgentId(clientInfo.agent_id || "");
  };

  const cancelEditing = () => {
    setEditingClientInfoId(null);
  };

  const saveClientInfo = async (clientInfo: ClientInfo) => {
    const updatedClientInfo = {
      ...clientInfo,
      company_name: editedCompanyName,
      notes: editedNotes,
      revio_id: editedRevioId,
      agent_id: editedAgentId
    };
    await onUpdateClientInfo(updatedClientInfo);
    setEditingClientInfoId(null);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {clientInfos.map((clientInfo) => (
        <Card key={clientInfo.id} className="bg-white shadow-md border-0">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Building className="w-4 h-4" />
              {editingClientInfoId === clientInfo.id ? (
                <Input
                  type="text"
                  value={editedCompanyName}
                  onChange={(e) => setEditedCompanyName(e.target.value)}
                  placeholder="Company Name"
                  className="h-8"
                />
              ) : (
                clientInfo.company_name
              )}
            </CardTitle>
            {editingClientInfoId === clientInfo.id ? (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => saveClientInfo(clientInfo)}
                >
                  <Save className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={cancelEditing}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => startEditing(clientInfo)}
              >
                <Pencil className="w-4 h-4" />
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <Label htmlFor={`notes-${clientInfo.id}`} className="text-xs text-gray-500">
                  Notes
                </Label>
                {editingClientInfoId === clientInfo.id ? (
                  <Input
                    id={`notes-${clientInfo.id}`}
                    type="text"
                    value={editedNotes}
                    onChange={(e) => setEditedNotes(e.target.value)}
                    placeholder="Notes"
                    className="h-8"
                  />
                ) : (
                  <p className="text-sm text-gray-900">{clientInfo.notes || "No notes"}</p>
                )}
              </div>
              <div>
                <Label htmlFor={`revio_id-${clientInfo.id}`} className="text-xs text-gray-500">
                  Revio ID
                </Label>
                {editingClientInfoId === clientInfo.id ? (
                  <Input
                    id={`revio_id-${clientInfo.id}`}
                    type="text"
                    value={editedRevioId}
                    onChange={(e) => setEditedRevioId(e.target.value)}
                    placeholder="Revio ID"
                    className="h-8"
                  />
                ) : (
                  <p className="text-sm text-gray-900">{clientInfo.revio_id || "No Revio ID"}</p>
                )}
              </div>
              <div>
                <Label htmlFor={`agent_id-${clientInfo.id}`} className="text-xs text-gray-500">
                  Agent
                </Label>
                {editingClientInfoId === clientInfo.id ? (
                  <Input
                    id={`agent_id-${clientInfo.id}`}
                    type="text"
                    value={editedAgentId}
                    onChange={(e) => setEditedAgentId(e.target.value)}
                    placeholder="Agent ID"
                    className="h-8"
                  />
                ) : (
                  <p className="text-sm text-gray-900">
                    {agentMapping[clientInfo.agent_id || ''] || "No Agent Assigned"}
                  </p>
                )}
              </div>
              <div className="text-xs text-gray-500">
                Created at: {new Date(clientInfo.created_at).toLocaleDateString()}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
