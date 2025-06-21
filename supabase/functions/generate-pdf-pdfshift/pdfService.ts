
export const generatePDFWithShift = async (html: string): Promise<ArrayBuffer> => {
  const pdfShiftResponse = await fetch('https://api.pdfshift.io/v3/convert/pdf', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${btoa(`api:${Deno.env.get('PDFSHIFT_API_KEY')}`)}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      source: html,
      landscape: false,
      format: 'Letter',
      margin: {
        top: '0.5in',
        right: '0.5in',
        bottom: '0.5in',
        left: '0.5in'
      }
    }),
  });

  console.log('PDFShift Function - API Response status:', pdfShiftResponse.status);

  if (!pdfShiftResponse.ok) {
    const errorText = await pdfShiftResponse.text();
    console.error('PDFShift API error:', errorText);
    throw new Error(`PDFShift API error: ${pdfShiftResponse.status} - ${errorText}`);
  }

  return await pdfShiftResponse.arrayBuffer();
};

export const convertToBase64 = (pdfBuffer: ArrayBuffer): string => {
  console.log('PDFShift Function - PDF buffer size:', pdfBuffer.byteLength);
  
  // Use TextDecoder with base64 encoding for efficient conversion
  const uint8Array = new Uint8Array(pdfBuffer);
  let binary = '';
  const chunkSize = 0x8000; // 32KB chunks to avoid call stack issues
  
  for (let i = 0; i < uint8Array.length; i += chunkSize) {
    const chunk = uint8Array.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  
  return btoa(binary);
};
