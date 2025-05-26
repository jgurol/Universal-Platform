
import { FileText, TrendingUp, Users, DollarSign } from "lucide-react";

export const QuoteManagementHeader = () => {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-3 bg-blue-100 rounded-lg">
          <FileText className="w-8 h-8 text-blue-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quoting System</h1>
          <p className="text-lg text-gray-600">Create, manage, and track your sales quotes</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 rounded-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100">Total Quotes</p>
              <p className="text-2xl font-bold">Active</p>
            </div>
            <FileText className="w-8 h-8 text-blue-200" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-green-500 to-green-600 p-4 rounded-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100">Approved</p>
              <p className="text-2xl font-bold">Quotes</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-200" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-4 rounded-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100">Active</p>
              <p className="text-2xl font-bold">Clients</p>
            </div>
            <Users className="w-8 h-8 text-purple-200" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-4 rounded-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100">Total</p>
              <p className="text-2xl font-bold">Revenue</p>
            </div>
            <DollarSign className="w-8 h-8 text-orange-200" />
          </div>
        </div>
      </div>
    </div>
  );
};
