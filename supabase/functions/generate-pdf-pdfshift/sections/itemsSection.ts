
export const generateItemsSection = (quoteItems: any[]) => {
  console.log('PDFShift Function - Processing', quoteItems?.length || 0, 'quote items');
  
  if (!quoteItems || quoteItems.length === 0) {
    return { mrcItems: [], nrcItems: [], totalMRC: 0, totalNRC: 0 };
  }

  const mrcItems: any[] = [];
  const nrcItems: any[] = [];
  let totalMRC = 0;
  let totalNRC = 0;

  quoteItems.forEach((item: any) => {
    const processedItem = {
      name: item.name || 'Unnamed Item',
      description: item.description || '',
      quantity: item.quantity || 1,
      unit_price: parseFloat(item.unit_price) || 0,
      total_price: parseFloat(item.total_price) || 0,
      charge_type: item.charge_type || 'NRC'
    };

    // Process rich text content for descriptions
    if (processedItem.description) {
      console.log('PDFShift Function - Processing rich text content:', processedItem.description.substring(0, 100) + '...');
      
      // Extract and count images
      const imageMatches = processedItem.description.match(/<img[^>]+src="([^"]+)"[^>]*>/g);
      const imageCount = imageMatches ? imageMatches.length : 0;
      console.log('PDFShift Function - Found images count:', imageCount);
      
      if (imageMatches) {
        imageMatches.forEach((match) => {
          const srcMatch = match.match(/src="([^"]+)"/);
          if (srcMatch) {
            console.log('PDFShift Function - Found image URL:', srcMatch[1].substring(0, 100) + '...');
          }
        });
      }

      // Process HTML content to clean format
      let processedContent = processedItem.description
        .replace(/<img[^>]*>/g, '') // Remove img tags for now
        .replace(/<[^>]*>/g, '') // Remove all other HTML tags
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .trim();

      console.log('PDFShift Function - Processed HTML length:', processedContent.length);
      processedItem.description = processedContent;
    }

    console.log('PDFShift Function - Item:', processedItem.name, 'has description length:', processedItem.description.length, 'images:', imageCount || 0);

    if (processedItem.charge_type === 'MRC') {
      mrcItems.push(processedItem);
      totalMRC += processedItem.total_price;
    } else {
      nrcItems.push(processedItem);
      totalNRC += processedItem.total_price;
    }
  });

  console.log('PDFShift Function - Processed items - MRC:', mrcItems.length, 'NRC:', nrcItems.length);
  
  return { mrcItems, nrcItems, totalMRC, totalNRC };
};
