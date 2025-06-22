import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Mail, Building, User, MapPin, Phone, Crown } from "lucide-react";
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
        const { data, error } = await supabase
          .from('client_contacts')
          .select('*')
          .in('client_info_id', clientIds)
          .eq('is_primary', true);

        if (error) {
          console.error('Error fetching primary contacts:', error);
          return;
        }

        // Create a mapping of client_info_id to primary contact
        const contactsMap: Record<string, ClientContact> = {};
        data?.forEach(contact => {
          contactsMap[contact.client_info_id] = contact;
        });
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
        const { data, error } = await supabase
          .from('client_addresses')
          .select('*')
          .in('client_info_id', clientIds)
          .eq('is_primary', true);

        if (error) {
          console.error('Error fetching primary addresses:', error);
          return;
        }

        // Create a mapping of client_info_id to primary address
        const addressesMap: Record<string, ClientAddress> = {};
        data?.forEach(address => {
          addressesMap[address.client_info_id] = address;
        });
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

  const formatAddress = (address: ClientAddress) => {
    const addressLine1 = address.street_address;
    const addressLine2 = address.street_address_2 ? `, ${address.street_address_2}` : '';
    return `${addressLine1}${addressLine2}, ${address.city}, ${address.state} ${address.zip_code}${address.country !== 'United States' ? `, ${address.country}` : ''}`;
  };

  return (
    <>
      <Card className="bg-white shadow-lg border-0">
        <CardContent>
          <div className="space-y-4">
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
                    className="flex flex-col p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                  >
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-gray-900">{clientInfo.company_name}</h3>
                          {clientInfo.agent_id && agentMap[clientInfo.agent_id] && (
                            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                              <User className="w-3 h-3 mr-1" />
                              {agentMap[clientInfo.agent_id]}
                            </Badge>
                          )}
                          {clientInfo.commission_override && (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              {clientInfo.commission_override}% Override
                            </Badge>
                          )}
                        </div>
                        
                        {/* Primary Contact and Address in Two Columns */}
                        {(primaryContact || primaryAddress) && (
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-3">
                            {/* Primary Contact Section */}
                            {primaryContact && (
                              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                                <div className="flex items-center gap-2 mb-2">
                                  <Crown className="w-4 h-4 text-yellow-600" />
                                  <span className="font-medium text-yellow-800">Primary Contact</span>
                                </div>
                                <div className="space-y-1 text-sm">
                                  <div className="font-medium text-gray-900">
                                    {primaryContact.first_name} {primaryContact.last_name}
                                  </div>
                                  {primaryContact.title && (
                                    <div className="text-gray-600">{primaryContact.title}</div>
                                  )}
                                  <div className="space-y-1 text-gray-600">
                                    {primaryContact.email && (
                                      <div className="flex items-center gap-1">
                                        <Mail className="w-3 h-3" />
                                        {primaryContact.email}
                                      </div>
                                    )}
                                    {primaryContact.phone && (
                                      <div className="flex items-center gap-1">
                                        <Phone className="w-3 h-3" />
                                        {primaryContact.phone}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Primary Address Section */}
                            {primaryAddress && (
                              <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                                <div className="flex items-center gap-2 mb-2">
                                  <MapPin className="w-4 h-4 text-green-600" />
                                  <span className="font-medium text-green-800">Primary Address</span>
                                  <Badge variant="secondary" className="bg-gray-100 text-gray-800 text-xs">
                                    {primaryAddress.address_type.charAt(0).toUpperCase() + primaryAddress.address_type.slice(1)}
                                  </Badge>
                                </div>
                                <div className="text-sm text-gray-700">
                                  {formatAddress(primaryAddress)}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                        
                        <div className="flex flex-col sm:flex-row gap-4 text-sm text-gray-600">
                          {clientInfo.contact_name && (
                            <div className="flex items-center gap-1">
                              <User className="w-4 h-4" />
                              {clientInfo.contact_name}
                            </div>
                          )}
                          {clientInfo.email && (
                            <div className="flex items-center gap-1">
                              <Mail className="w-4 h-4" />
                              {clientInfo.email}
                            </div>
                          )}
                          {clientInfo.phone && (
                            <div className="text-gray-500">
                              Phone: {clientInfo.phone}
                            </div>
                          )}
                        </div>
                        
                        {clientInfo.notes && (
                          <div className="mt-2 text-sm text-gray-600">
                            <strong>Notes:</strong> {clientInfo.notes}
                          </div>
                        )}
                        
                        {clientInfo.revio_id && (
                          <div className="mt-1 text-sm text-gray-500">
                            Revio ID: {clientInfo.revio_id}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-2 mt-3 md:mt-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setViewingContactsClientId(clientInfo.id)}
                          className="hover:bg-purple-50 hover:border-purple-300 text-purple-600"
                          title="View Contacts"
                        >
                          <User className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setViewingLocationsClientId(clientInfo.id)}
                          className="hover:bg-green-50 hover:border-green-300 text-green-600"
                          title="View Locations"
                        >
                          <MapPin className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingClientInfo(clientInfo)}
                          className="hover:bg-blue-50 hover:border-blue-300"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(clientInfo)}
                          className="hover:bg-red-50 hover:border-red-300 text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
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
