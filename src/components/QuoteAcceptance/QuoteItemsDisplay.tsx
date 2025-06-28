import React from 'react';
import { SecureHtmlDisplay } from '@/components/SecureHtmlDisplay';

interface QuoteItem {
  id: string;
  name?: string;
  description?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  charge_type: 'MRC' | 'NRC';
  item?: {
    name?: string;
    description?: string;
  };
}

interface QuoteItemsDisplayProps {
  items: QuoteItem[];
}

export const QuoteItemsDisplay: React.FC<QuoteItemsDisplayProps> = ({ items }) => {
  const mrcItems = items.filter(item => item.charge_type === 'MRC');
  const nrcItems = items.filter(item => item.charge_type === 'NRC');

  const renderItem = (item: QuoteItem) => {
    const itemName = item.name || item.item?.name || 'Service Item';
    const itemDescription = item.description || item.item?.description || '';

    console.log('QuoteItemsDisplay - Item name:', itemName);
    console.log('QuoteItemsDisplay - Item description raw:', itemDescription);

    return (
      <tr key={item.id} className="border-b">
        <td className="py-3 px-4">
          <div className="font-medium">{itemName}</div>
          {itemDescription && itemDescription.trim() && (
            <div className="mt-1">
              <SecureHtmlDisplay 
                content={itemDescription} 
                className="text-gray-600"
              />
            </div>
          )}
        </td>
        <td className="py-3 px-4 text-center">{item.quantity}</td>
        <td className="py-3 px-4 text-right">${item.unit_price.toFixed(2)}</td>
        <td className="py-3 px-4 text-center">
          <span className={`px-2 py-1 rounded text-xs font-medium ${
            item.charge_type === 'MRC' 
              ? 'bg-blue-100 text-blue-800' 
              : 'bg-gray-100 text-gray-800'
          }`}>
            {item.charge_type}
          </span>
        </td>
      </tr>
    );
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Quote Items</h3>
      
      {mrcItems.length > 0 && (
        <div>
          <h4 className="text-md font-medium mb-3">Monthly Recurring Charges (MRC)</h4>
          <div className="overflow-x-auto">
            <table className="w-full border border-gray-200 rounded-lg">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-3 px-4 text-left font-medium text-gray-700">Item</th>
                  <th className="py-3 px-4 text-center font-medium text-gray-700">Qty</th>
                  <th className="py-3 px-4 text-right font-medium text-gray-700">Unit Price</th>
                  <th className="py-3 px-4 text-center font-medium text-gray-700">Type</th>
                </tr>
              </thead>
              <tbody>
                {mrcItems.map(renderItem)}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {nrcItems.length > 0 && (
        <div>
          <h4 className="text-md font-medium mb-3">Non-Recurring Charges (NRC)</h4>
          <div className="overflow-x-auto">
            <table className="w-full border border-gray-200 rounded-lg">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-3 px-4 text-left font-medium text-gray-700">Item</th>
                  <th className="py-3 px-4 text-center font-medium text-gray-700">Qty</th>
                  <th className="py-3 px-4 text-right font-medium text-gray-700">Unit Price</th>
                  <th className="py-3 px-4 text-center font-medium text-gray-700">Type</th>
                </tr>
              </thead>
              <tbody>
                {nrcItems.map(renderItem)}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
