
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
  
  // Prioritize quote.serviceAddress, fallback to billing, then client address
  let finalServiceAddress = null;
  
  if (quote.serviceAddress && quote.serviceAddress.trim() !== '') {
    finalServiceAddress = quote.serviceAddress;
    console.log('PDF addressResolver - Using quote service address:', finalServiceAddress);
  } else if (billingAddress && billingAddress.trim() !== '') {
    finalServiceAddress = billingAddress;
    console.log('PDF addressResolver - Using billing address as service address:', finalServiceAddress);
  } else if (clientInfo?.address && clientInfo.address.trim() !== '') {
    finalServiceAddress = clientInfo.address;
    console.log('PDF addressResolver - Using client address as service address:', finalServiceAddress);
  }
  
  console.log('PDF addressResolver - Final service address determination:', {
    quoteServiceAddress: quote.serviceAddress,
    quoteServiceAddressLength: quote.serviceAddress?.length,
    quoteServiceAddressTrimmed: quote.serviceAddress?.trim(),
    billingAddress: billingAddress,
    clientInfoAddress: clientInfo?.address,
    finalServiceAddress: finalServiceAddress,
    finalServiceAddressLength: finalServiceAddress?.length
  });
  
  return finalServiceAddress;
};
