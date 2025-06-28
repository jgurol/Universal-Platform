
import { useState } from "react";
import { creditCheckService, CreditCheckResult } from "@/services/creditCheckService";
import { useToast } from "@/hooks/use-toast";

export const useCreditCheck = () => {
  const [creditResult, setCreditResult] = useState<CreditCheckResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const performCreditCheck = async (businessName: string, clientInfoId?: string) => {
    if (!businessName.trim()) {
      toast({
        title: "Business Name Required",
        description: "Please enter a business name to perform credit check.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    setCreditResult(null);

    try {
      const result = await creditCheckService.performCreditCheck(businessName);
      setCreditResult(result);
      
      // Store the result if clientInfoId is provided (for existing clients)
      if (clientInfoId) {
        await creditCheckService.storeCreditCheckResult(clientInfoId, result);
        toast({
          title: "Credit Check Complete",
          description: `Credit rating: ${result.creditRating} (Score: ${result.creditScore}) - Results saved to client record.`,
        });
      } else {
        toast({
          title: "Credit Check Complete",
          description: `Credit rating: ${result.creditRating} (Score: ${result.creditScore})`,
        });
      }
    } catch (error) {
      console.error('Credit check failed:', error);
      toast({
        title: "Credit Check Failed",
        description: error instanceof Error ? error.message : "Unable to perform credit check at this time.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const clearCreditResult = () => {
    setCreditResult(null);
  };

  return {
    creditResult,
    isLoading,
    performCreditCheck,
    clearCreditResult
  };
};
