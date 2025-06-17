
import { PDFGenerationContext } from '../types';

export const resolveBillingAddress = (context: PDFGenerationContext): string | null => {
  const { quote, clientInfo } = context;
  
  // Prioritize quote.billingAddress
  let billingAddress = quote.billingAddress;
  if (!billingAddress || billingAddress.trim() === '') {
    billingAddress = clientInfo?.address || null;
  }
  
  console.log('PDF addressResolver - Billing address determination:', {
    quoteBillingAddress: quote.billingAddress,
    quoteBillingAddressLength: quote.billingAddress?.length,
    quoteBillingAddressTrimmed: quote.billingAddress?.trim(),
    clientInfoAddress: clientInfo?.address,
    finalBillingAddress: billingAddress,
    finalBillingAddressLength: billingAddress?.length
  });
  
  return billingAddress;
};

export const resolveServiceAddress = (context: PDFGenerationContext, billingAddress: string | null): string | null => {
  const { quote, clientInfo } = context;
  
  // ONLY use quote.serviceAddress if it exists - don't auto-populate with billing or client address
  let finalServiceAddress = null;
  
  if (quote.serviceAddress && quote.serviceAddress.trim() !== '') {
    finalServiceAddress = quote.serviceAddress;
    console.log('PDF addressResolver - Using quote service address:', finalServiceAddress);
  } else {
    // Don't fall back to billing address or client address - respect blank service address
    finalServiceAddress = null;
    console.log('PDF addressResolver - Service address is blank, keeping it blank (no auto-population)');
  }
  
  console.log('PDF addressResolver - Final service address determination (no auto-population):', {
    quoteServiceAddress: quote.serviceAddress,
    quoteServiceAddressLength: quote.serviceAddress?.length,
    quoteServiceAddressTrimmed: quote.serviceAddress?.trim(),
    finalServiceAddress: finalServiceAddress,
    finalServiceAddressLength: finalServiceAddress?.length
  });
  
  return finalServiceAddress;
};
