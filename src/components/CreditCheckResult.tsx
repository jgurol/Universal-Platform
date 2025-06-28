
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { CreditCheckResult as CreditResult } from "@/services/creditCheckService";

interface CreditCheckResultProps {
  result: CreditResult;
  isLoading?: boolean;
}

export const CreditCheckResult = ({ result, isLoading }: CreditCheckResultProps) => {
  if (isLoading) {
    return (
      <Card className="border-blue-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="h-5 w-5 text-blue-600" />
            Credit Check
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Running credit check...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getRatingColor = (rating: CreditResult['creditRating']) => {
    switch (rating) {
      case 'Excellent': return 'bg-green-100 text-green-800 border-green-200';
      case 'Good': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Fair': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Poor': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Very Poor': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRiskIcon = (riskLevel: CreditResult['riskLevel']) => {
    switch (riskLevel) {
      case 'Low': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'Medium': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'High': return <XCircle className="h-4 w-4 text-red-600" />;
    }
  };

  return (
    <Card className="border-blue-200">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Shield className="h-5 w-5 text-blue-600" />
          Credit Check Result
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Credit Score</span>
              <span className="text-2xl font-bold text-gray-900">{result.creditScore}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Rating</span>
              <Badge className={getRatingColor(result.creditRating)}>
                {result.creditRating}
              </Badge>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Risk Level</span>
              <div className="flex items-center gap-1">
                {getRiskIcon(result.riskLevel)}
                <span className="text-sm font-medium">{result.riskLevel}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Report Date</span>
              <span className="text-sm text-gray-700">{new Date(result.reportDate).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Recommendation</h4>
          <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md">
            {result.recommendation}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
