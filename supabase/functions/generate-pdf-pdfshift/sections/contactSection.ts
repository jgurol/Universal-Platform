
export const generateContactSection = (primaryContact: any, clientInfo: any) => {
  console.log('PDFShift Function - Processing contact info');
  
  if (primaryContact) {
    console.log('PDFShift Function - Using primary contact:', primaryContact.first_name, primaryContact.last_name, 'email:', primaryContact.email, 'phone:', primaryContact.phone);
    return {
      name: `${primaryContact.first_name} ${primaryContact.last_name}`.trim(),
      email: primaryContact.email || '',
      phone: primaryContact.phone || '',
      title: primaryContact.title || ''
    };
  } else if (clientInfo) {
    console.log('PDFShift Function - Using client info:', clientInfo.contact_name, 'email:', clientInfo.email, 'phone:', clientInfo.phone);
    return {
      name: clientInfo.contact_name || '',
      email: clientInfo.email || '',
      phone: clientInfo.phone || '',
      title: ''
    };
  }
  
  console.log('PDFShift Function - No contact info available');
  return {
    name: '',
    email: '',
    phone: '',
    title: ''
  };
};
