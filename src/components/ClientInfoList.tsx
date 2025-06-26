import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Building, User, MapPin, Crown, Mail, Phone } from "lucide-react";
import { ClientInfo } from "@/pages/Index";
import { EditClientInfoDialog } from "@/components/EditClientInfoDialog";
import { ClientLocationsDialog } from "@/components/ClientLocationsDialog";
import { ClientContactsDialog } from "@/components/ClientContactsDialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ClientContact } from "@/types/clientContacts";
import { ClientAddress } from "@/types/clientAddress";

interface ClientInfoListProps {
  clientInfos: ClientInfo[];
  onUpdateClientInfo: (clientInfo: ClientInfo) => void;
  agentMapping: Record<string, string>;
}

interface Agent {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  company_name: string;
}

export const ClientInfoList = ({ 
  clientInfos, 
  onUpdateClientInfo,
  agentMapping 
}: ClientInfoListProps) => {
  const [editingClientInfo, setEditingClientInfo] = useState<ClientInfo | null>(null);
  const [viewingLocationsClientId, setViewingLocationsClientId] = useState<string | null>(null);
  const [viewingContactsClientId, setViewingContactsClientId] = useState<string | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [agentMap, setAgentMap] = useState<Record<string, string>>({});
  const [primaryContacts, setPrimaryContacts] = useState<Record<string, ClientContact>>({});
  const [primaryAddresses, setPrimaryAddresses] = useState<Record<string, ClientAddress>>({});
  const { toast } = useToast();

  // Fetch agents to create mapping
  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const { data, error } = await supabase
          .from('agents')
          .select('id, first_name, last_name, email, company_name');
        
        if (error) {
          console.error('Error fetching agents:', error);
          return;
        }

        setAgents(data || []);
        
        // Create agent mapping
        const mapping: Record<string, string> = {};
        data?.forEach(agent => {
          const displayName = `${agent.first_name} ${agent.last_name}${agent.company_name ? ` (${agent.company_name})` : ''}`;
          mapping[agent.id] = displayName;
        });
        setAgentMap(mapping);
      } catch (err) {
        console.error('Error in agent fetch:', err);
      }
    };

    fetchAgents();
  }, []);

  // Fetch primary contacts for all clients  
  useEffect(() => {
    const fetchPrimaryContacts = async () => {
      if (clientInfos.length === 0) return;

      try {
        const clientIds = clientInfos.map(client => client.id);
        console.log('Fetching primary contacts for client IDs:', clientIds);
        
        const { data, error } = await supabase
          .from('client_contacts')
          .select('*')
          .in('client_info_id', clientIds)
          .eq('is_primary', true);

        if (error) {
          console.error('Error fetching primary contacts:', error);
          return;
        }

        console.log('Primary contacts data:', data);

        // Create a mapping of client_info_id to primary contact
        const contactsMap: Record<string, ClientContact> = {};
        data?.forEach(contact => {
          contactsMap[contact.client_info_id] = contact;
        });
        console.log('Primary contacts map:', contactsMap);
        setPrimaryContacts(contactsMap);
      } catch (err) {
        console.error('Error in primary contacts fetch:', err);
      }
    };

    fetchPrimaryContacts();
  }, [clientInfos]);

  // Fetch primary addresses for all clients
  useEffect(() => {
    const fetchPrimaryAddresses = async () => {
      if (clientInfos.length === 0) return;

      try {
        const clientIds = clientInfos.map(client => client.id);
        console.log('Fetching primary addresses for client IDs:', clientIds);
        
        const { data, error } = await supabase
          .from('client_addresses')
          .select('*')
          .in('client_info_id', clientIds)
          .eq('is_primary', true);

        if (error) {
          console.error('Error fetching primary addresses:', error);
          return;
        }

        console.log('Primary addresses data:', data);

        // Create a mapping of client_info_id to primary address
        const addressesMap: Record<string, ClientAddress> = {};
        data?.forEach(address => {
          addressesMap[address.client_info_id] = address;
        });
        console.log('Primary addresses map:', addressesMap);
        setPrimaryAddresses(addressesMap);
      } catch (err) {
        console.error('Error in primary addresses fetch:', err);
      }
    };

    fetchPrimaryAddresses();
  }, [clientInfos]);

  const handleDelete = async (clientInfo: ClientInfo) => {
    if (window.confirm(`Are you sure you want to delete ${clientInfo.company_name}?`)) {
      try {
        const { error } = await supabase
          .from('client_info')
          .delete()
          .eq('id', clientInfo.id);

        if (error) throw error;

        // Signal deletion to parent component
        onUpdateClientInfo({ ...clientInfo, _delete: true } as any);
        
        toast({
          title: "Client deleted",
          description: `${clientInfo.company_name} has been deleted successfully.`,
        });
      } catch (err) {
        console.error('Error deleting client:', err);
        toast({
          title: "Failed to delete client",
          description: err instanceof Error ? err.message : "An error occurred",
          variant: "destructive"
        });
      }
    }
  };

  const formatCompactAddress = (address: ClientAddress) => {
    return `${address.city}, ${address.state}`;
  };

  const formatContactInfo = (contact: ClientContact) => {
    const parts = [];
    if (contact.first_name && contact.last_name) {
      parts.push(`${contact.first_name} ${contact.last_name}`);
    }
    return parts.join(' • ');
  };

  return (
    <>
      <Card className="bg-white shadow-lg border-0">
        <CardContent>
          <div className="space-y-3">
            {clientInfos.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Building className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No clients added yet. Click "Add Client" to get started!</p>
              </div>
            ) : (
              clientInfos.map((clientInfo) => {
                const primaryContact = primaryContacts[clientInfo.id];
                const primaryAddress = primaryAddresses[clientInfo.id];
                
                return (
                  <div
                    key={clientInfo.id}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                  >
                    <div className="flex-1 min-w-0">
                      {/* Line 1: Company Name + Agent + Commission Override */}
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 truncate">{clientInfo.company_name}</h3>
                        {clientInfo.agent_id && agentMap[clientInfo.agent_id] && (
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs flex-shrink-0">
                            <User className="w-3 h-3 mr-1" />
                            {agentMap[clientInfo.agent_id].split(' ')[0]} {/* Just first name for space */}
                          </Badge>
                        )}
                        {clientInfo.commission_override && (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs flex-shrink-0">
                            {clientInfo.commission_override}%
                          </Badge>
                        )}
                      </div>
                      
                      {/* Line 2: Contact Name + Phone + Email + Address + Notes */}
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        {primaryContact && (
                          <>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <Crown className="w-3 h-3 text-yellow-600" />
                              <span className="truncate max-w-[120px]">{formatContactInfo(primaryContact)}</span>
                            </div>
                            {primaryContact.phone && (
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <Phone className="w-3 h-3 text-blue-600" />
                                <span>{primaryContact.phone}</span>
                              </div>
                            )}
                            {primaryContact.email && (
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <Mail className="w-3 h-3 text-purple-600" />
                                <span className="truncate max-w-[150px]">{primaryContact.email}</span>
                              </div>
                            )}
                          </>
                        )}
                        {primaryAddress && (
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <MapPin className="w-3 h-3 text-green-600" />
                            <span>{formatCompactAddress(primaryAddress)}</span>
                          </div>
                        )}
                        {clientInfo.notes && (
                          <div className="truncate text-gray-500 italic">
                            "{clientInfo.notes}"
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-1 ml-3 flex-shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setViewingContactsClientId(clientInfo.id)}
                        className="hover:bg-purple-50 hover:border-purple-300 text-purple-600 p-2"
                        title="View Contacts"
                      >
                        <User className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setViewingLocationsClientId(clientInfo.id)}
                        className="hover:bg-green-50 hover:border-green-300 text-green-600 p-2"
                        title="View Locations"
                      >
                        <MapPin className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingClientInfo(clientInfo)}
                        className="hover:bg-blue-50 hover:border-blue-300 p-2"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(clientInfo)}
                        className="hover:bg-red-50 hover:border-red-300 text-red-600 p-2"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {editingClientInfo && (
        <EditClientInfoDialog
          clientInfo={editingClientInfo}
          open={!!editingClientInfo}
          onOpenChange={(open) => !open && setEditingClientInfo(null)}
          onUpdateClientInfo={onUpdateClientInfo}
        />
      )}

      {viewingLocationsClientId && (
        <ClientLocationsDialog
          clientId={viewingLocationsClientId}
          open={!!viewingLocationsClientId}
          onOpenChange={(open) => !open && setViewingLocationsClientId(null)}
        />
      )}

      {viewingContactsClientId && (
        <ClientContactsDialog
          clientId={viewingContactsClientId}
          open={!!viewingContactsClientId}
          onOpenChange={(open) => !open && setViewingContactsClientId(null)}
        />
      )}
    </>
  );
};
