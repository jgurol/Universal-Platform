
import React from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertCircle } from "lucide-react";
import { useAcceptQuoteData } from "@/hooks/useAcceptQuoteData";
import { useQuoteAcceptance } from "@/hooks/useQuoteAcceptance";
import { QuoteInformation } from "@/components/AcceptQuote/QuoteInformation";
import { QuoteItemsDisplay } from "@/components/AcceptQuote/QuoteItemsDisplay";
import { AcceptanceForm } from "@/components/AcceptQuote/AcceptanceForm";
import { AcceptedState } from "@/components/AcceptQuote/AcceptedState";

const AcceptQuote = () => {
  const { quoteId } = useParams<{ quoteId: string }>();
  
  const {
    quote,
    quoteItems,
    clientInfo,
    contacts,
    primaryContact,
    isLoading,
    isAccepted,
    error,
    acceptedAt,
    templateContent,
    templateLoading,
    setIsAccepted,
    setAcceptedAt
  } = useAcceptQuoteData(quoteId);

  const {
    isSubmitting,
    clientName,
    setClientName,
    clientEmail,
    setClientEmail,
    signatureData,
    setSignatureData,
    handleAcceptQuote
  } = useQuoteAcceptance();

  // Set initial values from primary contact
  React.useEffect(() => {
    if (primaryContact && !clientName && !clientEmail) {
      setClientName(`${primaryContact.first_name} ${primaryContact.last_name}`);
      setClientEmail(primaryContact.email || '');
    }
  }, [primaryContact, clientName, clientEmail, setClientName, setClientEmail]);

  const onAcceptQuote = () => {
    handleAcceptQuote(quote, (acceptanceDate) => {
      setIsAccepted(true);
      setAcceptedAt(acceptanceDate);
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading quote...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
              <p className="text-gray-600">{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isAccepted) {
    return <AcceptedState acceptedAt={acceptedAt} />;
  }

  if (!quote) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Quote Not Found</h2>
              <p className="text-gray-600">The requested quote could not be found.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm border">
          {/* Header */}
          <QuoteInformation 
            quote={quote} 
            clientInfo={clientInfo} 
            primaryContact={primaryContact} 
          />

          {/* Quote Details */}
          <div className="p-6 space-y-6">
            {/* Quote Items */}
            <QuoteItemsDisplay quoteItems={quoteItems} />

            {/* Initial Term - Debug version */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Debug Info</h3>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <p className="text-sm">Quote term value: "{quote.term}"</p>
                <p className="text-sm">Term exists: {quote.term ? 'true' : 'false'}</p>
                <p className="text-sm">Term not empty: {quote.term && quote.term.trim() !== '' ? 'true' : 'false'}</p>
              </div>
            </div>

            {quote.term && quote.term.trim() !== '' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Initial Term</h3>
                <div className="bg-gray-50 border rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-800">{quote.term}</p>
                </div>
              </div>
            )}

            {/* Terms and Conditions */}
            {templateContent && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Terms & Conditions</h3>
                <div className="border rounded-lg">
                  <ScrollArea className="h-80 w-full p-4">
                    {templateLoading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
                        <p>Loading terms and conditions...</p>
                      </div>
                    ) : (
                      <div 
                        className="prose prose-sm max-w-none text-sm leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: templateContent }}
                      />
                    )}
                  </ScrollArea>
                </div>
                <p className="text-xs text-gray-500">
                  Please review all terms and conditions above before accepting this quote.
                </p>
              </div>
            )}

            {/* Acceptance Form */}
            <AcceptanceForm
              clientName={clientName}
              setClientName={setClientName}
              clientEmail={clientEmail}
              setClientEmail={setClientEmail}
              signatureData={signatureData}
              setSignatureData={setSignatureData}
              isSubmitting={isSubmitting}
              onAccept={onAcceptQuote}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AcceptQuote;
