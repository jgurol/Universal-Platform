
import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Edit, Trash2, PenTool } from "lucide-react";
import { Quote, Client, ClientInfo } from "@/pages/Index";
import { generateQuotePDF } from "@/utils/pdfUtils";
import { useToast } from "@/hooks/use-toast";

interface QuoteCardProps {
  quote: Quote;
  clients: Client[];
  clientInfos: ClientInfo[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onInitiateSignature: (quote: Quote, clientInfo?: ClientInfo, salesperson?: string) => void;
}

export const QuoteCard = ({ 
  quote, 
  clients, 
  clientInfos, 
  onEdit, 
  onDelete, 
  onInitiateSignature 
}: QuoteCardProps) => {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const { toast } = useToast();

  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true);
    try {
      const clientInfo = clientInfos.find(info => info.id === quote.clientInfoId);
      const doc = await generateQuotePDF(quote, clientInfo);
      const fileName = `quote-${quote.quoteNumber || quote.id.slice(0, 8)}.pdf`;
      doc.save(fileName);
      toast({
        title: "PDF Download Started",
        description: `The quote has been downloaded as ${fileName}`,
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "Error",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleEdit = () => {
    onEdit(quote.id);
  };

  const handleDelete = () => {
    onDelete(quote.id);
  };

  const handleAcceptAgreement = () => {
    console.log("Accept Agreement button clicked for quote:", quote.id);
    
    const clientInfo = clientInfos.find(info => info.id === quote.clientInfoId);
    const salesperson = quote.clientId ? clients.find(c => c.id === quote.clientId) : null;
    
    console.log("Client info found:", clientInfo);
    console.log("Salesperson found:", salesperson);
    
    onInitiateSignature(quote, clientInfo, salesperson?.name);
    
    console.log("Signature initiated");
  };

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-semibold">{quote.description}</h3>
          <p className="text-sm text-gray-500">
            Quote Number: {quote.quoteNumber || `Q-${quote.id.slice(0, 8)}`}
          </p>
        </div>
        <Badge variant="secondary">{quote.status}</Badge>
      </div>

      <div className="mb-4">
        <p className="text-gray-600">
          Client: {quote.clientName} ({quote.companyName})
        </p>
        <p className="text-gray-600">Amount: ${quote.amount.toFixed(2)}</p>
        <p className="text-gray-600">Date: {new Date(quote.date).toLocaleDateString()}</p>
        {quote.expiresAt && (
          <p className="text-gray-600">
            Expires: {new Date(quote.expiresAt).toLocaleDateString()}
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mt-4">
        <Button
          onClick={handleDownloadPDF}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
          disabled={isGeneratingPDF}
        >
          <Download className="h-4 w-4" />
          Download PDF
        </Button>
        
        <Button
          onClick={handleAcceptAgreement}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
        >
          <PenTool className="h-4 w-4" />
          Accept Agreement
        </Button>

        <Button
          onClick={handleEdit}
          className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600"
        >
          <Edit className="h-4 w-4" />
          Edit
        </Button>
        <Button
          onClick={handleDelete}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700"
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </Button>
      </div>
    </Card>
  );
};
