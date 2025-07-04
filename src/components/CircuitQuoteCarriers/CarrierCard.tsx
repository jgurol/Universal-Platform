import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Copy, GripVertical, MessageSquare } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useCategories } from "@/hooks/useCategories";
import { useClients } from "@/hooks/useClients";
import type { CarrierQuote } from "@/hooks/useCircuitQuotes";
import { DraggableProvidedDragHandleProps } from "react-beautiful-dnd";
import { CarrierQuoteNotesDialog } from "@/components/CarrierQuoteNotesDialog";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface CarrierCardProps {
  carrier: CarrierQuote;
  onEdit?: (carrier: CarrierQuote) => void;
  onDelete?: (carrierId: string) => void;
  onCopy?: (carrier: CarrierQuote) => void;
  dragHandleProps?: DraggableProvidedDragHandleProps | null;
}

export const CarrierCard = ({ carrier, onEdit, onDelete, onCopy, dragHandleProps }: CarrierCardProps) => {
  const { isAdmin, user } = useAuth();
  const { categories } = useCategories();
  const { clients } = useClients();
  const [showNotesDialog, setShowNotesDialog] = useState(false);
  const [notesCount, setNotesCount] = useState(0);
  
  const isPending = !carrier.price || carrier.price === 0;
  const isNoService = carrier.no_service;

  // Load notes count for this carrier
  useEffect(() => {
    const loadNotesCount = async () => {
      try {
        const { count, error } = await supabase
          .from('carrier_quote_notes')
          .select('*', { count: 'exact', head: true })
          .eq('carrier_quote_id', carrier.id);

        if (error) {
          console.error('Error loading notes count:', error);
          return;
        }

        setNotesCount(count || 0);
      } catch (error) {
        console.error('Error loading notes count:', error);
      }
    };

    loadNotesCount();
  }, [carrier.id]);

  // Refresh notes count when dialog closes
  const handleNotesDialogClose = (open: boolean) => {
    setShowNotesDialog(open);
    if (!open) {
      // Reload notes count after dialog closes
      const loadNotesCount = async () => {
        try {
          const { count, error } = await supabase
            .from('carrier_quote_notes')
            .select('*', { count: 'exact', head: true })
            .eq('carrier_quote_id', carrier.id);

          if (error) {
            console.error('Error loading notes count:', error);
            return;
          }

          setNotesCount(count || 0);
        } catch (error) {
          console.error('Error loading notes count:', error);
        }
      };
      loadNotesCount();
    }
  };
  
  // Helper function to format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };
  
  // Helper function to extract term months from term string
  const getTermMonths = (term: string | undefined): number => {
    if (!term) return 36; // Default to 36 months if no term specified
    
    const termLower = term.toLowerCase();
    const monthMatch = termLower.match(/(\d+)\s*month/);
    const yearMatch = termLower.match(/(\d+)\s*year/);
    
    if (monthMatch) {
      return parseInt(monthMatch[1]);
    } else if (yearMatch) {
      return parseInt(yearMatch[1]) * 12;
    }
    
    return 36; // Default fallback
  };
  
  // Calculate markup price for agents
  const getDisplayPrice = () => {
    const termMonths = getTermMonths(carrier.term);
    
    if (isAdmin || isPending || isNoService) {
      let basePrice = carrier.price;
      
      // Add static IP fees
      if (carrier.static_ip && carrier.static_ip_fee_amount) {
        basePrice += carrier.static_ip_fee_amount;
      }
      if (carrier.static_ip_5 && carrier.static_ip_5_fee_amount) {
        basePrice += carrier.static_ip_5_fee_amount;
      }
      
      // Add amortized install fee (divided by contract term in months)
      if (carrier.install_fee && carrier.install_fee_amount) {
        basePrice += carrier.install_fee_amount / termMonths;
      }
      
      // Add other costs
      if ((carrier as any).other_costs) {
        basePrice += (carrier as any).other_costs;
      }
      
      return basePrice;
    }

    // Find matching category for the carrier type
    const matchingCategory = categories.find(cat => 
      cat.type?.toLowerCase() === carrier.type.toLowerCase() ||
      cat.name.toLowerCase().includes(carrier.type.toLowerCase())
    );

    // Get agent commission rate
    const currentAgent = clients.find(client => client.id === user?.id);
    const agentCommissionRate = currentAgent?.commissionRate || 15;

    if (matchingCategory && matchingCategory.minimum_markup && matchingCategory.minimum_markup > 0) {
      // Calculate effective minimum markup after commission reduction
      const originalMinimumMarkup = matchingCategory.minimum_markup;
      const effectiveMinimumMarkup = Math.max(0, originalMinimumMarkup);
      
      let basePrice = carrier.price;
      
      // Add static IP fees
      if (carrier.static_ip && carrier.static_ip_fee_amount) {
        basePrice += carrier.static_ip_fee_amount;
      }
      if (carrier.static_ip_5 && carrier.static_ip_5_fee_amount) {
        basePrice += carrier.static_ip_5_fee_amount;
      }
      
      // Add amortized install fee (divided by contract term in months)
      if (carrier.install_fee && carrier.install_fee_amount) {
        basePrice += carrier.install_fee_amount / termMonths;
      }
      
      // Add other costs
      if ((carrier as any).other_costs) {
        basePrice += (carrier as any).other_costs;
      }
      
      // Apply the markup: sell price = cost * (1 + markup/100)
      const markup = effectiveMinimumMarkup / 100;
      return Math.round(basePrice * (1 + markup) * 100) / 100;
    }

    let basePrice = carrier.price;
    
    // Add static IP fees
    if (carrier.static_ip && carrier.static_ip_fee_amount) {
      basePrice += carrier.static_ip_fee_amount;
    }
    if (carrier.static_ip_5 && carrier.static_ip_5_fee_amount) {
      basePrice += carrier.static_ip_5_fee_amount;
    }
    
    // Add amortized install fee (divided by contract term in months)
    if (carrier.install_fee && carrier.install_fee_amount) {
      basePrice += carrier.install_fee_amount / termMonths;
    }
    
    // Add other costs
    if ((carrier as any).other_costs) {
      basePrice += (carrier as any).other_costs;
    }
    
    return basePrice;
  };

  // Get base price without add-ons for display
  const getBasePriceWithoutAddOns = () => {
    if (isAdmin || isPending || isNoService) {
      return carrier.price;
    }

    // Find matching category for the carrier type
    const matchingCategory = categories.find(cat => 
      cat.type?.toLowerCase() === carrier.type.toLowerCase() ||
      cat.name.toLowerCase().includes(carrier.type.toLowerCase())
    );

    if (matchingCategory && matchingCategory.minimum_markup && matchingCategory.minimum_markup > 0) {
      const effectiveMinimumMarkup = Math.max(0, matchingCategory.minimum_markup);
      const markup = effectiveMinimumMarkup / 100;
      return Math.round(carrier.price * (1 + markup) * 100) / 100;
    }

    return carrier.price;
  };

  // For agents, check if all required data is loaded before displaying price
  const isDataReady = isAdmin || (categories.length > 0 && clients.length > 0);
  
  const displayPrice = getDisplayPrice();
  const basePriceWithoutAddOns = getBasePriceWithoutAddOns();
  
  // Calculate total add-on costs
  const totalAddOnCosts = (carrier.static_ip && carrier.static_ip_fee_amount ? carrier.static_ip_fee_amount : 0) +
                         (carrier.static_ip_5 && carrier.static_ip_5_fee_amount ? carrier.static_ip_5_fee_amount : 0) +
                         (carrier.install_fee && carrier.install_fee_amount ? carrier.install_fee_amount / getTermMonths(carrier.term) : 0) +
                         ((carrier as any).other_costs ? (carrier as any).other_costs : 0);
  
  // Only show base price if there are meaningful add-ons (total > 0) AND base price > 0 AND user is admin
  const shouldShowBasePrice = isAdmin && totalAddOnCosts > 0 && basePriceWithoutAddOns > 0 && basePriceWithoutAddOns !== displayPrice;
  
  // Helper function to get site survey color
  const getSiteSurveyColor = () => {
    if (!carrier.site_survey_needed) return null;
    
    if (carrier.notes && carrier.notes.includes("Site Survey:")) {
      const parts = carrier.notes.split("Site Survey:");
      if (parts.length > 1) {
        const colorPart = parts[1].trim().toLowerCase();
        if (colorPart.startsWith("red")) return "red";
        if (colorPart.startsWith("yellow")) return "yellow";
        if (colorPart.startsWith("orange")) return "orange";
        if (colorPart.startsWith("green")) return "green";
      }
    }
    return "yellow"; // Default color if no specific color is found
  };

  // Helper function to get card background class based on site survey
  const getCardBackgroundClass = () => {
    if (isNoService) return 'bg-red-50 border-red-200';
    
    const siteSurveyColor = getSiteSurveyColor();
    if (siteSurveyColor) {
      switch (siteSurveyColor) {
        case "red": return 'bg-red-100 border-red-300';
        case "yellow": return 'bg-yellow-100 border-yellow-300';
        case "orange": return 'bg-orange-100 border-orange-300';
        case "green": return 'bg-green-100 border-green-300';
        default: return 'bg-yellow-100 border-yellow-300';
      }
    }
    
    return 'bg-gray-50';
  };

  // Helper function to get ticked checkboxes based on carrier details
  const getTickedCheckboxes = () => {
    const ticked = [];
    if (carrier.install_fee) {
      let installText = "Install Fee";
      if (carrier.install_fee_amount && carrier.install_fee_amount > 0) {
        if (isAdmin) {
          installText += ` ($${carrier.install_fee_amount})`;
        } else {
          installText += " (included)";
        }
      }
      ticked.push(installText);
    }
    if (carrier.site_survey_needed) {
      // Extract color from notes if present
      let surveyText = "Site Survey";
      const siteSurveyColor = getSiteSurveyColor();
      if (siteSurveyColor) {
        surveyText = `Site Survey (${siteSurveyColor.toUpperCase()})`;
      }
      ticked.push(surveyText);
    }
    if (carrier.no_service) ticked.push("No Service");
    if (carrier.static_ip) {
      let staticIpText = "1 Static IP (/30)";
      if (carrier.static_ip_fee_amount && carrier.static_ip_fee_amount > 0) {
        if (isAdmin) {
          staticIpText += ` ($${carrier.static_ip_fee_amount})`;
        } else {
          staticIpText += " (included)";
        }
      }
      ticked.push(staticIpText);
    }
    if ((carrier as any).static_ip_5) {
      let staticIp5Text = "5 Static IP (/29)";
      if ((carrier as any).static_ip_5_fee_amount && (carrier as any).static_ip_5_fee_amount > 0) {
        if (isAdmin) {
          staticIp5Text += ` ($${(carrier as any).static_ip_5_fee_amount})`;
        } else {
          staticIp5Text += " (included)";
        }
      }
      ticked.push(staticIp5Text);
    }
    if ((carrier as any).other_costs && (carrier as any).other_costs > 0) {
      let otherCostsText = "Other MRC Cost";
      if (isAdmin) {
        otherCostsText += ` ($${(carrier as any).other_costs})`;
      } else {
        otherCostsText += " (included)";
      }
      ticked.push(otherCostsText);
    }
    return ticked;
  };

  const tickedOptions = getTickedCheckboxes();

  return (
    <>
      <div 
        className={`border rounded-lg p-4 ${getCardBackgroundClass()}`}
      >
        <div className="flex items-center gap-4">
          {/* Drag handle for admins */}
          {isAdmin && dragHandleProps && (
            <div 
              {...dragHandleProps}
              className="flex items-center justify-center w-6 h-6 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 flex-shrink-0"
            >
              <GripVertical className="h-4 w-4" />
            </div>
          )}
          
          {/* Main content in a flexible grid */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-8 gap-4 items-center">
            <div>
              <div 
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium text-white shadow-sm ${
                  isPending && !isNoService ? 'animate-pulse' : ''
                }`}
                style={{ backgroundColor: carrier.color || '#3B82F6' }}
              >
                {carrier.carrier}
              </div>
            </div>
            
            <div>
              <div className="text-sm">{carrier.type}</div>
            </div>
            
            <div>
              <div className="text-sm">{carrier.speed}</div>
            </div>
            
            <div>
              <div className={`text-sm ${isNoService ? 'text-red-600' : 'font-semibold'}`}>
                {isNoService ? 'No Service' : (
                  // For agents, only show price if data is ready and price > 0
                  (!isAdmin && !isDataReady) ? (
                    <span className="text-orange-600 text-sm">Loading...</span>
                  ) : (
                    displayPrice > 0 ? formatCurrency(displayPrice) : (
                      <span className="text-orange-600 text-sm">Pending</span>
                    )
                  )
                )}
              </div>
              {/* Show base price without add-ons only if there are significant add-ons AND user is admin */}
              {!isNoService && displayPrice > 0 && shouldShowBasePrice && (
                <div className="text-xs text-gray-500 mt-1">
                  Base: {formatCurrency(basePriceWithoutAddOns)}
                </div>
              )}
            </div>
            
            <div>
              <div className="text-sm">
                {carrier.term && <div>{carrier.term}</div>}
              </div>
            </div>
            
            <div className="md:col-span-2">
              <div className="text-sm text-gray-600">
                {tickedOptions.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {tickedOptions.map((option, index) => {
                      let badgeClass = "bg-blue-100 text-blue-800";
                      
                      if (option === 'No Service') {
                        badgeClass = "bg-red-100 text-red-800";
                      } else if (option.includes('Static IP')) {
                        badgeClass = "bg-green-100 text-green-800";
                      } else if (option.includes('Other MRC Cost')) {
                        badgeClass = "bg-purple-100 text-purple-800";
                      } else if (option.includes('Site Survey')) {
                        if (option.includes('RED')) {
                          badgeClass = "bg-red-100 text-red-800";
                        } else if (option.includes('YELLOW')) {
                          badgeClass = "bg-yellow-100 text-yellow-800";
                        } else if (option.includes('ORANGE')) {
                          badgeClass = "bg-orange-100 text-orange-800";
                        } else if (option.includes('GREEN')) {
                          badgeClass = "bg-green-100 text-green-800";
                        }
                      }
                      
                      return (
                        <span 
                          key={index} 
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${badgeClass}`}
                        >
                          {option}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
            
            <div>
              {/* This column is intentionally empty to balance the grid */}
            </div>
          </div>
          
          {/* Action buttons - always on the right */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowNotesDialog(true)}
                className="h-8 w-8 p-0 text-gray-500 hover:text-blue-600"
                title="View/Add Notes"
              >
                <MessageSquare className="h-4 w-4" />
              </Button>
              {/* Notes count badge */}
              {notesCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px] min-w-[16px]"
                >
                  {notesCount}
                </Badge>
              )}
            </div>
            {isAdmin && onCopy && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onCopy(carrier)}
                className="h-8 w-8 p-0 text-gray-500 hover:text-green-600"
                title="Copy Carrier Quote"
              >
                <Copy className="h-4 w-4" />
              </Button>
            )}
            {isAdmin && onEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(carrier)}
                className="h-8 w-8 p-0"
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
            {isAdmin && onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(carrier.id)}
                className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      <CarrierQuoteNotesDialog
        open={showNotesDialog}
        onOpenChange={handleNotesDialogClose}
        carrierId={carrier.id}
        carrierName={`${carrier.carrier} - ${carrier.type} - ${carrier.speed}`}
        initialNotes={carrier.notes || ""}
        onNotesUpdate={(notes) => {
          // Optionally handle notes update here if needed
        }}
      />
    </>
  );
};
