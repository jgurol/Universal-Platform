
import { useState, useEffect } from "react";
import { QuoteItemData } from "@/types/quoteItems";
import { getTodayInTimezone } from "@/utils/dateUtils";
import { DealRegistration } from "@/services/dealRegistrationService";

export const useAddQuoteForm = (open: boolean) => {
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
  const [associatedDeals, setAssociatedDeals] = useState<DealRegistration[]>([]);
  const [selectedDealId, setSelectedDealId] = useState<string>(""); // Changed from array to single string
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Function to calculate expiration date (+60 days from quote date)
  const calculateExpirationDate = (quoteDate: string): string => {
    if (!quoteDate) return "";
    
    const date = new Date(quoteDate);
    date.setDate(date.getDate() + 60);
    
    // Format as YYYY-MM-DD for input
    return date.toISOString().split('T')[0];
  };

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
    setSelectedDealId("none"); // Changed to use "none" instead of empty string
    setIsSubmitting(false);
    
    // Reset dates
    const todayDate = getTodayInTimezone();
    setDate(todayDate);
    setExpiresAt(calculateExpirationDate(todayDate));
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
    }
  }, [open]);

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

  const calculateTotalAmount = () => {
    return quoteItems.reduce((total, item) => total + item.total_price, 0);
  };

  return {
    // Form state
    clientId,
    setClientId,
    clientInfoId,
    setClientInfoId,
    date,
    setDate,
    description,
    setDescription,
    quoteNumber,
    setQuoteNumber,
    quoteMonth,
    setQuoteMonth,
    quoteYear,
    setQuoteYear,
    term,
    setTerm,
    expiresAt,
    setExpiresAt,
    notes,
    setNotes,
    commissionOverride,
    setCommissionOverride,
    quoteItems,
    setQuoteItems,
    billingAddress,
    setBillingAddress,
    selectedBillingAddressId,
    setSelectedBillingAddressId,
    serviceAddress,
    setServiceAddress,
    selectedServiceAddressId,
    setSelectedServiceAddressId,
    selectedTemplateId,
    setSelectedTemplateId,
    associatedDeals,
    setAssociatedDeals,
    selectedDealId, // Changed from selectedDealIds to selectedDealId
    setSelectedDealId, // Changed from setSelectedDealIds to setSelectedDealId
    isSubmitting,
    setIsSubmitting,
    
    // Helper functions
    resetForm,
    calculateExpirationDate,
    handleBillingAddressChange,
    handleServiceAddressChange,
    calculateTotalAmount
  };
};
