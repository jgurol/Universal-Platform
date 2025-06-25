
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DealRegistration } from "@/services/dealRegistrationService";
import { useToast } from "@/hooks/use-toast";

interface DealDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dealId: string | null;
}

export const DealDetailsDialog = ({ open, onOpenChange, dealId }: DealDetailsDialogProps) => {
  const [deal, setDeal] = useState<DealRegistration | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchDeal = async () => {
      if (!dealId || !open) {
        setDeal(null);
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('deal_registrations')
          .select('*')
          .eq('id', dealId)
          .single();

        if (error) {
          console.error('Error fetching deal:', error);
          toast({
            title: "Error",
            description: "Failed to load deal details",
            variant: "destructive"
          });
        } else {
          setDeal(data);
        }
      } catch (error) {
        console.error('Error fetching deal:', error);
        toast({
          title: "Error",
          description: "Failed to load deal details",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDeal();
  }, [dealId, open, toast]);

  if (!deal && !loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Deal Details</DialogTitle>
            <DialogDescription>
              Deal information not found
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Deal Details</DialogTitle>
          <DialogDescription>
            Information about the associated deal registration
          </DialogDescription>
        </DialogHeader>
        
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        ) : deal ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-500">Deal Name</Label>
                <p className="text-sm font-medium">{deal.deal_name}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Deal Value</Label>
                <p className="text-sm font-medium">${deal.deal_value.toLocaleString()}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-500">Stage</Label>
                <p className="text-sm capitalize">{deal.stage.replace('-', ' ')}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Probability</Label>
                <p className="text-sm">{deal.probability}%</p>
              </div>
            </div>
            
            {deal.expected_close_date && (
              <div>
                <Label className="text-sm font-medium text-gray-500">Expected Close Date</Label>
                <p className="text-sm">{new Date(deal.expected_close_date).toLocaleDateString()}</p>
              </div>
            )}
            
            {deal.description && (
              <div>
                <Label className="text-sm font-medium text-gray-500">Description</Label>
                <p className="text-sm">{deal.description}</p>
              </div>
            )}
            
            {deal.notes && (
              <div>
                <Label className="text-sm font-medium text-gray-500">Notes</Label>
                <p className="text-sm">{deal.notes}</p>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
              <div>
                <Label className="text-sm font-medium text-gray-500">Status</Label>
                <p className="text-sm capitalize">{deal.status}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Created</Label>
                <p className="text-sm">{new Date(deal.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        ) : null}
        
        <div className="flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
