
import { Badge } from "@/components/ui/badge";

interface QuoteItem {
  id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  charge_type: 'MRC' | 'NRC';
  item?: {
    name: string;
    description?: string;
  };
}

interface QuoteItemsDisplayProps {
  quoteItems: QuoteItem[];
}

export const QuoteItemsDisplay = ({ quoteItems }: QuoteItemsDisplayProps) => {
  // Helper function to strip HTML from text
  const stripHtml = (html: string): string => {
    if (!html) return '';
    
    let cleanText = html.replace(/<[^>]*>/g, '');
    
    cleanText = cleanText
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&apos;/g, "'");
    
    cleanText = cleanText.replace(/&[a-zA-Z0-9#]+;/g, '');
    
    return cleanText.replace(/\s+/g, ' ').trim();
  };

  const getMRCTotal = () => {
    return quoteItems
      .filter(item => item.charge_type === 'MRC')
      .reduce((total, item) => total + Number(item.total_price), 0);
  };

  const getNRCTotal = () => {
    return quoteItems
      .filter(item => item.charge_type === 'NRC')
      .reduce((total, item) => total + Number(item.total_price), 0);
  };

  const totalAmount = getMRCTotal() + getNRCTotal();

  return (
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">Quote Items</h3>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-50">
              <th className="border border-gray-300 px-4 py-2 text-left">Item</th>
              <th className="border border-gray-300 px-4 py-2 text-center">Qty</th>
              <th className="border border-gray-300 px-4 py-2 text-right">Unit Price</th>
              <th className="border border-gray-300 px-4 py-2 text-center">Type</th>
              <th className="border border-gray-300 px-4 py-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {quoteItems.map((item) => (
              <tr key={item.id}>
                <td className="border border-gray-300 px-4 py-2">
                  <div>
                    <div className="font-medium">{item.item?.name || 'Item'}</div>
                    {item.item?.description && (
                      <div className="text-sm text-gray-600">{stripHtml(item.item.description)}</div>
                    )}
                  </div>
                </td>
                <td className="border border-gray-300 px-4 py-2 text-center">{item.quantity}</td>
                <td className="border border-gray-300 px-4 py-2 text-right">${Number(item.unit_price).toFixed(2)}</td>
                <td className="border border-gray-300 px-4 py-2 text-center">
                  <Badge variant={item.charge_type === 'MRC' ? 'default' : 'secondary'}>
                    {item.charge_type}
                  </Badge>
                </td>
                <td className="border border-gray-300 px-4 py-2 text-right font-medium">
                  ${Number(item.total_price).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="mt-4 space-y-2">
        {getMRCTotal() > 0 && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Monthly Recurring Charges (MRC):</span>
            <span className="font-medium">${getMRCTotal().toFixed(2)}/month</span>
          </div>
        )}
        {getNRCTotal() > 0 && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Non-Recurring Charges (NRC):</span>
            <span className="font-medium">${getNRCTotal().toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between items-center text-lg font-bold border-t border-gray-200 pt-2">
          <span>Total Quote Value:</span>
          <span>${totalAmount.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};
