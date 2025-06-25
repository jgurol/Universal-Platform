
import { Client, ClientInfo } from "@/pages/Index";
import { useQuoteDialogUserProfile } from "@/hooks/useQuoteDialogUserProfile";
import { useQuoteDialogClientFiltering } from "@/hooks/useQuoteDialogClientFiltering";
import { useQuoteDialogDeals } from "@/hooks/useQuoteDialogDeals";
import { useQuoteDialogTemplates } from "@/hooks/useQuoteDialogTemplates";

export const useQuoteDialogData = (open: boolean, clients: Client[], clientInfos: ClientInfo[], clientInfoId: string) => {
  // Get user profile data
  const { userProfile, currentUserName, isAdmin } = useQuoteDialogUserProfile(open);
  
  // Get filtered client infos
  const { filteredClientInfos, isDataLoading } = useQuoteDialogClientFiltering(open, clientInfos, userProfile);
  
  // Get associated deals
  const { associatedDeals, setAssociatedDeals } = useQuoteDialogDeals(clientInfoId);
  
  // Get templates
  const { templates, setTemplates } = useQuoteDialogTemplates(open);

  return {
    templates,
    setTemplates,
    isDataLoading,
    filteredClientInfos,
    userProfile,
    currentUserName,
    isAdmin,
    associatedDeals,
    setAssociatedDeals
  };
};
