
import { Quote, ClientInfo } from '@/pages/Index';
import { supabase } from '@/integrations/supabase/client';

export const generateQuotePDF = async (quote: Quote, clientInfo?: ClientInfo, salespersonName?: string) => {
  console.log('PDF Generation - Using PDFShift integration for quote:', quote.id);
  console.log('PDF Generation - Quote user_id before sending:', quote.user_id);
  console.log('PDF Generation - Provided salespersonName:', salespersonName);
  
  try {
    // Ensure we have the user_id in the quote object
    let quoteWithUserId = quote;
    
    // If user_id is missing, fetch it from the database
    if (!quote.user_id) {
      console.log('PDF Generation - user_id missing, fetching from database');
      const { data: quoteData, error } = await supabase
        .from('quotes')
        .select('user_id')
        .eq('id', quote.id)
        .single();
      
      if (error) {
        console.error('PDF Generation - Error fetching user_id:', error);
      } else if (quoteData?.user_id) {
        quoteWithUserId = { ...quote, user_id: quoteData.user_id };
        console.log('PDF Generation - Fetched user_id:', quoteData.user_id);
      }
    }
    
    // If no salesperson name provided, fetch the quote owner's name
    let finalSalespersonName = salespersonName;
    if (!finalSalespersonName || finalSalespersonName.trim() === '') {
      console.log('PDF Generation - No salesperson name provided, fetching quote owner name');
      
      if (quoteWithUserId.user_id) {
        try {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', quoteWithUserId.user_id)
            .single();
          
          if (!error && profile?.full_name && profile.full_name.trim() !== '') {
            finalSalespersonName = profile.full_name;
            console.log('PDF Generation - Found quote owner name:', finalSalespersonName);
          } else {
            finalSalespersonName = 'Sales Team';
            console.log('PDF Generation - Could not fetch quote owner name, using fallback');
          }
        } catch (error) {
          console.error('PDF Generation - Error fetching quote owner name:', error);
          finalSalespersonName = 'Sales Team';
        }
      } else {
        finalSalespersonName = 'Sales Team';
        console.log('PDF Generation - No user_id available, using fallback');
      }
    }
    
    console.log('PDF Generation - Final salesperson name:', finalSalespersonName);
    
    // Fetch primary contact for PDF generation
    let primaryContact = null;
    if (clientInfo?.id) {
      console.log('PDF Generation - Fetching primary contact for client:', clientInfo.id);
      const { data: contactData, error: contactError } = await supabase
        .from('client_contacts')
        .select('*')
        .eq('client_info_id', clientInfo.id)
        .eq('is_primary', true)
        .maybeSingle();
      
      if (contactError) {
        console.error('PDF Generation - Error fetching primary contact:', contactError);
      } else if (contactData) {
        primaryContact = contactData;
        console.log('PDF Generation - Found primary contact:', contactData.first_name, contactData.last_name, 'email:', contactData.email, 'phone:', contactData.phone);
      } else {
        console.log('PDF Generation - No primary contact found for client:', clientInfo.id);
      }
    } else {
      console.log('PDF Generation - No client info ID provided, cannot fetch primary contact');
    }
    
    // Call our edge function to generate PDF using PDFShift
    const { data, error } = await supabase.functions.invoke('generate-pdf-pdfshift', {
      body: {
        quote: quoteWithUserId,
        clientInfo,
        salespersonName: finalSalespersonName,
        primaryContact
      }
    });

    if (error) {
      console.error('PDFShift generation error:', error);
      throw new Error(`Failed to generate PDF: ${error.message}`);
    }

    if (!data || !data.pdf) {
      console.error('No PDF data received from PDFShift:', data);
      throw new Error('No PDF data received from PDFShift');
    }

    console.log('PDFShift - PDF data length:', data.pdf.length);

    // Convert base64 to blob
    const pdfBlob = base64ToBlob(data.pdf, 'application/pdf');
    console.log('PDFShift - PDF blob created, size:', pdfBlob.size);
    
    // Create a mock jsPDF-like object for compatibility
    const mockPDF = {
      output: (type: string) => {
        console.log('PDFShift - Output requested, type:', type);
        if (type === 'blob') {
          return pdfBlob;
        }
        return pdfBlob;
      }
    };

    console.log('PDF Generation - PDFShift PDF generated successfully');
    return mockPDF;
    
  } catch (error) {
    console.error('Error generating PDF with PDFShift:', error);
    throw error;
  }
};

// Helper function to convert base64 to blob
const base64ToBlob = (base64: string, mimeType: string): Blob => {
  try {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  } catch (error) {
    console.error('Error converting base64 to blob:', error);
    throw new Error('Failed to convert PDF data');
  }
};
