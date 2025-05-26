
import { QuoteDebugger } from "@/components/QuoteDebugger";

export default function QuotingSystem() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Quoting System</h1>
      
      {/* Temporary debugger for circuit tracking issues */}
      <div className="mb-8">
        <QuoteDebugger />
      </div>
      
      <div className="text-center py-12">
        <p className="text-gray-600">Quoting system features will be added here.</p>
      </div>
    </div>
  );
}
