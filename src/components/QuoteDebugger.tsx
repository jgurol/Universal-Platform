
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

export const QuoteDebugger = () => {
  const [quoteId, setQuoteId] = useState("f3194d9e-96fb-4c53-8c5a-0f40dd0c9c6b");
  const [debugResult, setDebugResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const debugQuote = async () => {
    setIsLoading(true);
    try {
      console.log('Debugging quote:', quoteId);
      
      const { data, error } = await supabase.functions.invoke('debug-quote-items', {
        body: { quoteId }
      });

      if (error) {
        console.error('Error debugging quote:', error);
        throw error;
      }

      console.log('Debug result:', data);
      setDebugResult(data);
    } catch (error) {
      console.error('Error:', error);
      setDebugResult({ error: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const runFixQuoteApproval = async () => {
    setIsLoading(true);
    try {
      console.log('Running fix-quote-approval for quote:', quoteId);
      
      const { data, error } = await supabase.functions.invoke('fix-quote-approval', {
        body: { quoteId }
      });

      if (error) {
        console.error('Error running fix-quote-approval:', error);
        throw error;
      }

      console.log('Fix quote approval result:', data);
      // Refresh debug info after running fix
      await debugQuote();
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Quote Circuit Tracking Debugger</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex space-x-2">
          <Input
            value={quoteId}
            onChange={(e) => setQuoteId(e.target.value)}
            placeholder="Enter quote ID"
            className="flex-1"
          />
          <Button onClick={debugQuote} disabled={isLoading}>
            Debug Quote
          </Button>
          <Button onClick={runFixQuoteApproval} disabled={isLoading} variant="outline">
            Run Fix Quote Approval
          </Button>
        </div>

        {debugResult && (
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Quote Items:</h3>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                {JSON.stringify(debugResult.quoteItems, null, 2)}
              </pre>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Existing Circuit Tracking:</h3>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                {JSON.stringify(debugResult.existingTracking, null, 2)}
              </pre>
            </div>

            {debugResult.error && (
              <div>
                <h3 className="font-semibold mb-2 text-red-600">Error:</h3>
                <pre className="bg-red-100 p-4 rounded text-sm overflow-auto">
                  {debugResult.error}
                </pre>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
