
import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { Quote, ClientInfo } from '@/pages/Index';

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 20,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  section: {
    marginBottom: 15,
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingVertical: 8,
    alignItems: 'flex-start',
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: '#d0d0d0',
    fontWeight: 'bold',
    fontSize: 9,
  },
  itemName: {
    width: '35%',
    paddingHorizontal: 4,
    fontSize: 9,
    fontWeight: 'bold',
  },
  itemDescription: {
    width: '35%',
    paddingHorizontal: 4,
    fontSize: 8,
    color: '#555',
    lineHeight: 1.3,
  },
  itemLocation: {
    fontSize: 7,
    color: '#777',
    marginTop: 2,
    fontStyle: 'italic',
  },
  qty: {
    width: '10%',
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  price: {
    width: '12%',
    textAlign: 'right',
    paddingHorizontal: 4,
  },
  total: {
    width: '13%',
    textAlign: 'right',
    paddingHorizontal: 4,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 10,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 2,
    borderTopColor: '#333',
  },
  totalLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    marginRight: 20,
  },
  totalAmount: {
    fontSize: 12,
    fontWeight: 'bold',
    width: '15%',
    textAlign: 'right',
  },
});

interface QuotePdfDocumentProps {
  quote: Quote;
  clientInfo?: ClientInfo;
}

export const QuotePdfDocument: React.FC<QuotePdfDocumentProps> = ({ quote, clientInfo }) => {
  const mrcItems = quote.quoteItems?.filter(item => item.charge_type === 'MRC') || [];
  const nrcItems = quote.quoteItems?.filter(item => item.charge_type === 'NRC') || [];

  const stripHtml = (html: string): string => {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .trim();
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>
            {quote.description || (clientInfo?.company_name ? `${clientInfo.company_name} - Service Agreement` : 'Service Agreement')}
          </Text>
        </View>

        {/* Monthly Fees Section */}
        {mrcItems.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Monthly Fees</Text>
            
            {/* Table Header */}
            <View style={styles.headerRow}>
              <Text style={styles.itemName}>Description</Text>
              <Text style={styles.qty}>Qty</Text>
              <Text style={styles.price}>Price</Text>
              <Text style={styles.total}>Total</Text>
            </View>

            {/* Items */}
            {mrcItems.map((item, index) => (
              <View key={item.id} style={[styles.row, { backgroundColor: index % 2 === 0 ? '#fafafa' : '#ffffff' }]}>
                <View style={styles.itemName}>
                  <Text style={{ fontWeight: 'bold', marginBottom: 2 }}>
                    {item.name || item.item?.name || 'Monthly Service'}
                  </Text>
                  {item.address && (
                    <Text style={styles.itemLocation}>
                      Location: {item.address.street_address}, {item.address.city}, {item.address.state} {item.address.zip_code}
                    </Text>
                  )}
                  {(item.description || item.item?.description) && (
                    <Text style={styles.itemDescription}>
                      {stripHtml(item.description || item.item?.description || '')}
                    </Text>
                  )}
                </View>
                <Text style={styles.qty}>{item.quantity}</Text>
                <Text style={styles.price}>${Number(item.unit_price).toFixed(2)}</Text>
                <Text style={styles.total}>${Number(item.total_price).toFixed(2)}</Text>
              </View>
            ))}

            {/* MRC Total */}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Monthly:</Text>
              <Text style={styles.totalAmount}>
                ${mrcItems.reduce((total, item) => total + Number(item.total_price), 0).toFixed(2)} USD
              </Text>
            </View>
          </View>
        )}

        {/* One-Time Fees */}
        {nrcItems.length > 0 && (
          <View style={styles.section}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>One-Time Setup Fees:</Text>
              <Text style={styles.totalAmount}>
                ${nrcItems.reduce((total, item) => total + Number(item.total_price), 0).toFixed(2)} USD
              </Text>
            </View>
          </View>
        )}
      </Page>
    </Document>
  );
};
