import { Button } from "@/components/ui/button";
import { Edit, Trash2, Copy } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useCategories } from "@/hooks/useCategories";
import { useClients } from "@/hooks/useClients";
import type { CarrierQuote } from "@/hooks/useCircuitQuotes";

interface CarrierCardProps {
  carrier: CarrierQuote;
  onEdit?: (carrier: CarrierQuote) => void;
  onDelete?: (carrierId: string) => void;
  onCopy?: (carrier: CarrierQuote) => void;
}

export const CarrierCard = ({ carrier, onEdit, onDelete, onCopy }: CarrierCardProps) => {
  const { isAdmin, user } = useAuth();
  const { categories } = useCategories();
  const { clients } = useClients();
  
  const isPending = !carrier.price || carrier.price === 0;
  const isNoService = carrier.no_service;
  
  // Calculate display price immediately and ensure agents never see cost during loading
  const displayPrice = (() => {
    // Always show actual price for admins, pending, or no service
    if (isAdmin || isPending || isNoService) {
      return carrier.price;
    }

    // For non-admin users, if categories or clients data isn't loaded yet, 
    // show "Loading..." instead of the raw cost
    if (!categories.length || !clients.length) {
      return null; // This will show "Loading..." in the UI
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
      
      // Apply the markup: sell price = cost * (1 + markup/100)
      const markup = effectiveMinimumMarkup / 100;
      return Math.round(carrier.price * (1 + markup) * 100) / 100;
    }

    return carrier.price;
  })();
  
  const getTickedCheckboxes = () => {
    const ticked = [];
    if (carrier.install_fee) ticked.push("Install Fee");
    if (carrier.site_survey_needed) ticked.push("Site Survey");
    if (carrier.no_service) ticked.push("No Service");
    if (carrier.static_ip) ticked.push("Includes Static IP");
    return ticked;
  };

  const getLatestNote = (): string => {
    if (!carrier.notes) return '';
    
    const noteEntries = carrier.notes.split('\n\n').filter(note => note.trim());
    if (noteEntries.length === 0) return '';
    
    const latestNoteEntry = noteEntries[0];
    const datePattern = /^\d{4}-\d{2}-\d{2}:\s*/;
    return latestNoteEntry.replace(datePattern, '').trim();
  };

  const tickedOptions = getTickedCheckboxes();
  const latestNote = getLatestNote();

  return (
    <div 
      className={`border rounded-lg p-4 ${
        isNoService ? 'bg-red-50 border-red-200' : 'bg-gray-50'
      }`}
    >
      <div className="grid grid-cols-1 md:grid-cols-8 gap-4 items-center">
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
          <div className="font-medium">{carrier.type}</div>
        </div>
        
        <div>
          <div className="font-medium">{carrier.speed}</div>
        </div>
        
        <div>
          <div className={`font-semibold text-lg ${isNoService ? 'text-red-600' : ''}`}>
            {isNoService ? 'No Service' : (
              displayPrice === null ? (
                <span className="text-gray-500 text-sm">Loading...</span>
              ) : displayPrice > 0 ? `$${displayPrice}` : (
                <span className="text-orange-600 text-sm">Pending</span>
              )
            )}
          </div>
        </div>
        
        <div>
          <div className="text-sm">
            {carrier.term && <div className="font-medium">{carrier.term}</div>}
          </div>
        </div>
        
        <div className="md:col-span-2">
          <div className="text-sm text-gray-600">
            {tickedOptions.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-1">
                {tickedOptions.map((option, index) => (
                  <span 
                    key={index} 
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                      option === 'No Service' ? 'bg-red-100 text-red-800' : 
                      option === 'Includes Static IP' ? 'bg-green-100 text-green-800' :
                      'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {option}
                  </span>
                ))}
              </div>
            )}
            {latestNote}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
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
  );
};
