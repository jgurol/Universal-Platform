import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Quote, Client, ClientInfo } from "@/pages/Index";
import { getTodayInTimezone } from "@/utils/dateUtils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { QuoteItemsManager } from "@/components/QuoteItemsManager";
import { QuoteItemData } from "@/types/quoteItems";
import { AddressSelector } from "@/components/AddressSelector";
import { useToast } from "@/hooks/use-toast";
import { DealRegistration } from "@/services/dealRegistrationService";
import type { Database } from "@/integrations/supabase/types";

type QuoteTemplate = Database['public']['Tables']['quote_templates']['Row'];

interface AddQuoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddQuote: (quote: Omit<Quote, "id">) => void;
  clients: Client[];
  clientInfos: ClientInfo[]; 
}

export const AddQuoteDialog = ({ open, onOpenChange, onAddQuote, clients, clientInfos }: AddQuoteDialogProps) => {
  const { toast } = useToast();
  const [clientId, setClientId] = useState("");
  const [clientInfoId, setClientInfoId] = useState("");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [quoteNumber, setQuoteNumber] = useState("");
  const [quoteMonth, setQuoteMonth] = useState("");
  const [quoteYear, setQuoteYear] = useState("");
  const [term, setTerm] = useState("36 Months");
  const [expiresAt, setExpiresAt] = useState("");
  const [notes, setNotes] = useState("");
  const [commissionOverride, setCommissionOverride] = useState("");
  const [quoteItems, setQuoteItems] = useState<QuoteItemData[]>([]);
  const [billingAddress, setBillingAddress] = useState<string>("");
  const [selectedBillingAddressId, setSelectedBillingAddressId] = useState<string | null>(null);
  const [serviceAddress, setServiceAddress] = useState<string>("");
  const [selectedServiceAddressId, setSelectedServiceAddressId] = useState<string | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [templates, setTemplates] = useState<QuoteTemplate[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUserName, setCurrentUserName] = useState<string>("");
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [associatedDeals, setAssociatedDeals] = useState<DealRegistration[]>([]);
  const [selectedDealIds, setSelectedDealIds] = useState<string[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [filteredClientInfos, setFilteredClientInfos] = useState<ClientInfo[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const { user } = useAuth();
  
  // Fetch user profile and determine access level
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user || !open) {
        setUserProfile(null);
        return;
      }

      try {
        console.log('[AddQuoteDialog] Fetching user profile for:', user.id);
        const { data: profile } = await supabase
          .from('profiles')
          .select('associated_agent_id, role, full_name, email')
          .eq('id', user.id)
          .single();

        console.log('[AddQuoteDialog] User profile:', profile);
        setUserProfile(profile);
        setIsAdmin(profile?.role === 'admin');
        
        // Set current user name
        if (profile?.full_name && profile.full_name.trim() !== '') {
          setCurrentUserName(profile.full_name);
        } else if (profile?.email) {
          setCurrentUserName(profile.email);
        } else if (user.email) {
          setCurrentUserName(user.email.split('@')[0]);
        } else {
          setCurrentUserName('Current User');
        }
      } catch (error) {
        console.error('[AddQuoteDialog] Error fetching user profile:', error);
        setUserProfile(null);
        setIsAdmin(false);
        setCurrentUserName(user.email?.split('@')[0] || 'Current User');
      }
    };

    fetchUserProfile();
  }, [user, open]);
  
  // Filter client infos based on user's agent association - Fixed logic
  useEffect(() => {
    const filterClientInfos = () => {
      if (!open) {
        console.log('[AddQuoteDialog] Dialog closed, clearing filtered clients');
        setFilteredClientInfos([]);
        setIsDataLoading(false);
        return;
      }

      // Wait for user profile to be available
      if (!userProfile) {
        console.log('[AddQuoteDialog] Waiting for user profile');
        return;
      }

      // Set loading to false once we have user profile - regardless of client count
      setIsDataLoading(false);

      const isUserAdmin = userProfile.role === 'admin';
      console.log('[AddQuoteDialog] Filtering clients - isAdmin:', isUserAdmin, 'associatedAgentId:', userProfile.associated_agent_id);
      console.log('[AddQuoteDialog] Total clientInfos available:', clientInfos.length);

      if (isUserAdmin) {
        // Admin sees all clients
        console.log('[AddQuoteDialog] Admin user - showing all client infos');
        setFilteredClientInfos(clientInfos);
      } else {
        // For non-admin users, we need to check if they are associated with an agent
        // If they have an associated_agent_id, show clients for that agent
        // If they don't have an associated_agent_id, it means they ARE the agent, so show clients where agent_id matches their user_id
        
        let filtered: ClientInfo[] = [];
        
        if (userProfile.associated_agent_id) {
          // User is associated with an agent - show clients for that agent
          console.log('[AddQuoteDialog] User associated with agent:', userProfile.associated_agent_id);
          filtered = clientInfos.filter(client => {
            const matches = client.agent_id === userProfile.associated_agent_id;
            console.log('[AddQuoteDialog] Client', client.company_name, 'agent_id:', client.agent_id, 'matches:', matches);
            return matches;
          });
        } else {
          // User is not associated with an agent, so they might be an agent themselves
          // Check if there are any clients where agent_id matches user_id
          const agentClients = clientInfos.filter(client => client.agent_id === user?.id);
          
          if (agentClients.length > 0) {
            // User is an agent - show their clients
            console.log('[AddQuoteDialog] User is an agent - showing their clients');
            filtered = agentClients;
          } else {
            // User is neither admin nor agent - show only their own clients
            console.log('[AddQuoteDialog] Regular user - filtering by user_id:', user?.id);
            filtered = clientInfos.filter(client => client.user_id === user?.id);
          }
        }
        
        console.log('[AddQuoteDialog] Filtered client infos:', filtered.length);
        setFilteredClientInfos(filtered);
      }
    };

    // Filter as soon as we have user profile - don't wait for clientInfos
    if (userProfile) {
      filterClientInfos();
    }
  }, [userProfile, clientInfos, open, user?.id]);
  
  // Fetch deals associated with the selected client
  useEffect(() => {
    const fetchAssociatedDeals = async () => {
      if (!clientInfoId || clientInfoId === "none") {
        setAssociatedDeals([]);
        setSelectedDealIds([]);
        return;
      }

      try {
        const { data: deals, error } = await supabase
          .from('deal_registrations')
          .select('*')
          .eq('client_info_id', clientInfoId)
          .eq('status', 'active')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching associated deals:', error);
          setAssociatedDeals([]);
        } else {
          setAssociatedDeals(deals || []);
        }
      } catch (error) {
        console.error('Error fetching associated deals:', error);
        setAssociatedDeals([]);
      }
    };

    fetchAssociatedDeals();
  }, [clientInfoId]);
  
  // Function to reset all form fields
  const resetForm = () => {
    setClientId("");
    setClientInfoId("");
    setDescription("");
    setQuoteNumber("");
    setQuoteMonth("");
    setQuoteYear("");
    setTerm("36 Months");
    setNotes("");
    setCommissionOverride("");
    setQuoteItems([]);
    setBillingAddress("");
    setSelectedBillingAddressId(null);
    setServiceAddress("");
    setSelectedServiceAddressId(null);
    setSelectedTemplateId("");
    setAssociatedDeals([]);
    setSelectedDealIds([]);
    setIsSubmitting(false);
    
    // Reset dates
    const todayDate = getTodayInTimezone();
    setDate(todayDate);
    setExpiresAt(calculateExpirationDate(todayDate));
  };
  
  // Function to calculate expiration date (+60 days from quote date)
  const calculateExpirationDate = (quoteDate: string): string => {
    if (!quoteDate) return "";
    
    const date = new Date(quoteDate);
    date.setDate(date.getDate() + 60);
    
    // Format as YYYY-MM-DD for input
    return date.toISOString().split('T')[0];
  };
  
  // Initialize date with today's date in the configured timezone
  useEffect(() => {
    if (!date) {
      const todayDate = getTodayInTimezone();
      setDate(todayDate);
      setExpiresAt(calculateExpirationDate(todayDate));
    }
  }, []);

  // Update expiration date when quote date changes
  useEffect(() => {
    if (date) {
      setExpiresAt(calculateExpirationDate(date));
    }
  }, [date]);

  // Reset form when dialog opens or closes
  useEffect(() => {
    if (open) {
      resetForm();
      setIsDataLoading(true);
    }
  }, [open]);

  // Generate next quote number using the new global database function
  useEffect(() => {
    const generateNextQuoteNumber = async () => {
      if (open && user) {
        try {
          console.log('[AddQuoteDialog] Generating next global quote number');
          
          const { data, error } = await supabase.rpc('get_next_quote_number');

          if (error) {
            console.error('[AddQuoteDialog] Error generating quote number:', error);
            toast({
              title: "Error",
              description: "Failed to generate quote number. Please try again.",
              variant: "destructive",
            });
            setQuoteNumber("3500"); // Fallback
            return;
          }

          console.log('[AddQuoteDialog] Generated global quote number:', data);
          setQuoteNumber(data.toString());
        } catch (err) {
          console.error('[AddQuoteDialog] Exception generating quote number:', err);
          setQuoteNumber("3500"); // Fallback
          toast({
            title: "Error",
            description: "Failed to generate quote number. Using fallback number.",
            variant: "destructive",
          });
        }
      }
    };

    generateNextQuoteNumber();
  }, [open, user, toast]);

  // Load templates when dialog opens and auto-select default
  useEffect(() => {
    const fetchTemplates = async () => {
      if (open && user) {
        console.log('[AddQuoteDialog] Fetching templates for user:', user.id);
        try {
          const { data, error } = await supabase
            .from('quote_templates')
            .select('*')
            .order('name');

          console.log('[AddQuoteDialog] Templates query result:', { data, error });
          
          if (error) {
            console.error('[AddQuoteDialog] Error fetching templates:', error);
            setTemplates([]);
            setSelectedTemplateId("");
            toast({
              title: "Warning",
              description: "Could not load quote templates. You may need to create one first.",
              variant: "destructive",
            });
            return;
          }
          
          setTemplates(data || []);
          console.log('[AddQuoteDialog] Templates set:', data?.length || 0, 'templates');
          
          // Auto-select default template if available, otherwise select first template
          const defaultTemplate = data?.find(t => t.is_default);
          if (defaultTemplate) {
            console.log('[AddQuoteDialog] Auto-selecting default template:', defaultTemplate.name);
            setSelectedTemplateId(defaultTemplate.id);
          } else if (data && data.length > 0) {
            console.log('[AddQuoteDialog] No default template found, selecting first template:', data[0].name);
            setSelectedTemplateId(data[0].id);
          } else {
            console.log('[AddQuoteDialog] No templates available');
            setSelectedTemplateId("");
          }
        } catch (error) {
          console.error('[AddQuoteDialog] Error loading templates:', error);
          setTemplates([]);
          setSelectedTemplateId("");
          toast({
            title: "Warning",
            description: "Could not load quote templates. You may need to create one first.",
            variant: "destructive",
          });
        }
      }
    };

    fetchTemplates();
  }, [open, user, toast]);

  // Handle client selection - auto-select salesperson based on client's agent_id
  useEffect(() => {
    if (clientInfoId && clientInfoId !== "none") {
      const selectedClient = filteredClientInfos.find(info => info.id === clientInfoId);
      
      if (selectedClient && selectedClient.agent_id) {
        setClientId(selectedClient.agent_id);
      } else {
        setClientId("");
      }
    } else {
      setClientId("");
    }
  }, [clientInfoId, filteredClientInfos]);

  const handleBillingAddressChange = (addressId: string | null, customAddr?: string) => {
    console.log('AddQuoteDialog - Billing address changed:', { addressId, customAddr });
    setSelectedBillingAddressId(addressId);
    setBillingAddress(customAddr || "");
  };

  const handleServiceAddressChange = (addressId: string | null, customAddr?: string) => {
    console.log('AddQuoteDialog - Service address changed:', { addressId, customAddr });
    setSelectedServiceAddressId(addressId);
    setServiceAddress(customAddr || "");
  };

  const handleDealSelection = (dealId: string) => {
    setSelectedDealIds(prev => 
      prev.includes(dealId) 
        ? prev.filter(id => id !== dealId)
        : [...prev, dealId]
    );
  };

  const calculateTotalAmount = () => {
    return quoteItems.reduce((total, item) => total + item.total_price, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) {
      console.log('[AddQuoteDialog] Already submitting, ignoring duplicate submission');
      return;
    }

    console.log('[AddQuoteDialog] Form submitted - checking validation');
    console.log('[AddQuoteDialog] Form data:', {
      clientInfoId,
      date,
      quoteItemsLength: quoteItems.length,
      templatesLength: templates.length,
      selectedTemplateId,
      user: !!user,
      filteredClientInfosLength: filteredClientInfos.length
    });
    
    // Enhanced validation with specific error messages
    if (!user) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to create a quote.",
        variant: "destructive",
      });
      return;
    }

    if (!clientInfoId || clientInfoId === "none") {
      toast({
        title: "Client Required",
        description: filteredClientInfos.length === 0 
          ? "No client companies available. Please add a client company first in Deal Registration."
          : "Please select a client company before creating the quote.",
        variant: "destructive",
      });
      return;
    }

    if (!date) {
      toast({
        title: "Date Required",
        description: "Please select a quote date.",
        variant: "destructive",
      });
      return;
    }

    if (quoteItems.length === 0) {
      toast({
        title: "Items Required",
        description: "Please add at least one item to the quote before saving.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedTemplateId) {
      toast({
        title: "Template Required",
        description: templates.length === 0 
          ? "No quote templates found. Please create a template in System Settings first."
          : "Please select a quote template.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const totalAmount = calculateTotalAmount();
      const selectedClient = clientId ? clients.find(client => client.id === clientId) : null;
      const selectedClientInfo = filteredClientInfos.find(info => info.id === clientInfoId);
      
      if (!selectedClientInfo) {
        throw new Error("Selected client company not found");
      }

      const quoteData = {
        clientId: clientId || "",
        clientName: selectedClient?.name || currentUserName,
        companyName: selectedClientInfo.company_name,
        amount: totalAmount,
        date,
        description: description || `Quote for ${selectedClientInfo.company_name}`,
        quoteNumber: quoteNumber || undefined,
        quoteMonth: quoteMonth || undefined,
        quoteYear: quoteYear || undefined,
        term: term,
        status: "pending" as const,
        clientInfoId: clientInfoId,
        clientCompanyName: selectedClientInfo.company_name,
        commissionOverride: commissionOverride ? parseFloat(commissionOverride) : undefined,
        expiresAt: expiresAt || undefined,
        notes: notes || undefined,
        quoteItems: quoteItems,
        billingAddress: billingAddress || undefined,
        serviceAddress: serviceAddress || undefined,
        templateId: selectedTemplateId
      };
      
      console.log('[AddQuoteDialog] Calling onAddQuote with data:', quoteData);
      await onAddQuote(quoteData);
      
      toast({
        title: "Success",
        description: "Quote created successfully!",
      });
      
      // Reset form after successful submission
      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error('[AddQuoteDialog] Error creating quote:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create quote. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedSalesperson = clientId ? clients.find(c => c.id === clientId) : null;
  const selectedClientInfo = clientInfoId && clientInfoId !== "none" ? filteredClientInfos.find(info => info.id === clientInfoId) : null;

  // Check if form is valid for submission
  const isFormValid = !!(
    user &&
    clientInfoId && 
    clientInfoId !== "none" && 
    date &&
    quoteItems.length > 0 && 
    selectedTemplateId &&
    !isSubmitting &&
    !isDataLoading
  );

  console.log('[AddQuoteDialog] Form validation status:', {
    hasUser: !!user,
    hasClientInfo: !!(clientInfoId && clientInfoId !== "none"),
    hasDate: !!date,
    hasQuoteItems: quoteItems.length > 0,
    hasTemplate: !!selectedTemplateId,
    isSubmitting,
    isDataLoading,
    filteredClientInfosLength: filteredClientInfos.length,
    isFormValid
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[1400px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex justify-between items-start">
            <div>
              <DialogTitle>Add Quote</DialogTitle>
              <DialogDescription>
                Create a new quote for a client.
              </DialogDescription>
            </div>
            
            {/* Quote Details - Top Right */}
            <div className="grid grid-cols-1 gap-3 min-w-[280px]">
              <div className="space-y-2">
                <Label htmlFor="quoteNumber" className="text-sm">Quote Number</Label>
                <Input
                  id="quoteNumber"
                  value={quoteNumber}
                  onChange={(e) => setQuoteNumber(e.target.value)}
                  placeholder="Auto-generated"
                  disabled
                  className="h-8"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date" className="text-sm">Quote Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="h-8"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expiresAt" className="text-sm">Expiration Date (Auto +60 days)</Label>
                <Input
                  id="expiresAt"
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="h-8"
                />
              </div>

              {/* Associated Salesperson */}
              {selectedSalesperson ? (
                <div className="space-y-2">
                  <Label className="text-sm">Associated Salesperson</Label>
                  <div className="border rounded-md px-3 py-2 bg-muted text-muted-foreground text-sm">
                    {selectedSalesperson.name} {selectedSalesperson.companyName && `(${selectedSalesperson.companyName})`}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label className="text-sm">Associated Salesperson</Label>
                  <div className="border rounded-md px-3 py-2 bg-muted text-muted-foreground text-sm">
                    {currentUserName || 'Loading...'}
                  </div>
                </div>
              )}
            </div>
          </div>
        </DialogHeader>
        
        {/* Show loading state while data is loading */}
        {isDataLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <p className="text-muted-foreground">Loading form data...</p>
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Quote Name */}
          <div className="space-y-2">
            <Label htmlFor="description">Quote Name</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => {
                console.log('[AddQuoteDialog] Description changed to:', e.target.value);
                setDescription(e.target.value);
              }}
              placeholder="Enter quote name (optional - will auto-generate if empty)"
              disabled={isDataLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="clientInfo">Client Company *</Label>
            <Select value={clientInfoId} onValueChange={setClientInfoId} required disabled={isDataLoading}>
              <SelectTrigger>
                <SelectValue placeholder={
                  isDataLoading 
                    ? "Loading client companies..." 
                    : filteredClientInfos.length === 0 
                      ? "No clients available - Add clients first" 
                      : "Select a client company"
                } />
              </SelectTrigger>
              <SelectContent>
                {isDataLoading ? (
                  <SelectItem value="loading" disabled>
                    Loading...
                  </SelectItem>
                ) : filteredClientInfos.length === 0 ? (
                  <SelectItem value="no-clients" disabled>
                    No clients available - Add clients first
                  </SelectItem>
                ) : (
                  filteredClientInfos.map((clientInfo) => (
                    <SelectItem key={clientInfo.id} value={clientInfo.id}>
                      {clientInfo.company_name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {!isDataLoading && filteredClientInfos.length === 0 && (
              <p className="text-sm text-amber-600">
                No client companies found. Please add a client company in Deal Registration first.
              </p>
            )}
          </div>

          {/* Associated Deals Section */}
          {associatedDeals.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Associated Deals (Optional)</Label>
              <div className="border rounded-md p-3 bg-gray-50 max-h-32 overflow-y-auto">
                <p className="text-xs text-gray-600 mb-2">
                  Select deals to associate with this quote:
                </p>
                <div className="space-y-2">
                  {associatedDeals.map((deal) => (
                    <div key={deal.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`deal-${deal.id}`}
                        checked={selectedDealIds.includes(deal.id)}
                        onCheckedChange={() => handleDealSelection(deal.id)}
                        disabled={isDataLoading}
                      />
                      <label
                        htmlFor={`deal-${deal.id}`}
                        className="text-sm cursor-pointer flex-1"
                      >
                        <span className="font-medium">{deal.deal_name}</span>
                        <span className="text-gray-500 ml-2">
                          (${deal.deal_value.toLocaleString()} - {deal.stage})
                        </span>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              {selectedDealIds.length > 0 && (
                <p className="text-xs text-green-600">
                  {selectedDealIds.length} deal{selectedDealIds.length > 1 ? 's' : ''} selected
                </p>
              )}
            </div>
          )}

          <AddressSelector
            clientInfoId={clientInfoId !== "none" ? clientInfoId : null}
            selectedAddressId={selectedBillingAddressId || undefined}
            onAddressChange={handleBillingAddressChange}
            label="Billing Address"
            autoSelectPrimary={true}
          />

          <AddressSelector
            clientInfoId={clientInfoId !== "none" ? clientInfoId : null}
            selectedAddressId={selectedServiceAddressId || undefined}
            onAddressChange={handleServiceAddressChange}
            label="Service Address (Optional)"
            autoSelectPrimary={false}
          />

          <div className="space-y-2">
            <Label className="text-sm font-medium">Quote Items *</Label>
            <QuoteItemsManager 
              items={quoteItems}
              onItemsChange={setQuoteItems}
              clientInfoId={clientInfoId !== "none" ? clientInfoId : undefined}
            />
            {quoteItems.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Add at least one item to create the quote
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="templateId">Quote Template *</Label>
            <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId} required disabled={isDataLoading}>
              <SelectTrigger>
                <SelectValue placeholder={
                  isDataLoading
                    ? "Loading templates..."
                    : templates.length === 0 
                      ? "No templates available" 
                      : selectedTemplateId 
                        ? `${templates.find(t => t.id === selectedTemplateId)?.name}${templates.find(t => t.id === selectedTemplateId)?.is_default ? " (Default)" : ""}`
                        : "Select a quote template"
                } />
              </SelectTrigger>
              <SelectContent>
                {isDataLoading ? (
                  <SelectItem value="loading" disabled>
                    Loading...
                  </SelectItem>
                ) : templates.length === 0 ? (
                  <SelectItem value="no-templates" disabled>
                    No templates available - Create templates first
                  </SelectItem>
                ) : (
                  templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}{template.is_default ? " (Default)" : ""}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {!isDataLoading && templates.length === 0 && (
              <p className="text-sm text-amber-600">
                No quote templates found. Please create a template in System Settings → Quote Templates first.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="term">Initial Term</Label>
            <Select value={term} onValueChange={setTerm} disabled={isDataLoading}>
              <SelectTrigger>
                <SelectValue placeholder="Select initial term" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Month to Month">Month to Month</SelectItem>
                <SelectItem value="12 Months">12 Months</SelectItem>
                <SelectItem value="24 Months">24 Months</SelectItem>
                <SelectItem value="36 Months">36 Months</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Commission Override - Only show for admins */}
          {isAdmin && (
            <div className="space-y-2">
              <Label htmlFor="commissionOverride">Commission Override (%)</Label>
              <Input
                id="commissionOverride"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={commissionOverride}
                onChange={(e) => setCommissionOverride(e.target.value)}
                placeholder="Optional commission override"
                disabled={isDataLoading}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes about the quote"
              rows={3}
              disabled={isDataLoading}
            />
          </div>
          
          <div className="flex justify-end space-x-2 mt-6">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-blue-600 hover:bg-blue-700"
              disabled={!isFormValid}
            >
              {isSubmitting ? "Creating Quote..." : "Add Quote"}
            </Button>
          </div>
          
          {/* Debug info - only show in development */}
          {process.env.NODE_ENV === 'development' && (
            <div className="text-xs text-muted-foreground border-t pt-2">
              Debug: Form valid = {isFormValid ? 'true' : 'false'} 
              (User: {!!user ? 'yes' : 'no'}, ClientInfo: {clientInfoId && clientInfoId !== "none" ? 'yes' : 'no'}, 
              Date: {!!date ? 'yes' : 'no'}, Items: {quoteItems.length}, Template: {!!selectedTemplateId ? 'yes' : 'no'}, 
              DataLoading: {isDataLoading ? 'yes' : 'no'}, FilteredClients: {filteredClientInfos.length})
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
};
