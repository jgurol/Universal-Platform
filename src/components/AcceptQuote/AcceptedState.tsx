
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";

interface AcceptedStateProps {
  acceptedAt: string | null;
}

export const AcceptedState = ({ acceptedAt }: AcceptedStateProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Quote Accepted</h2>
            {acceptedAt && (
              <p className="text-sm text-gray-500 mb-2">
                Accepted on: {new Date(acceptedAt).toLocaleString()}
              </p>
            )}
            <p className="text-gray-600">This quote has already been accepted. Thank you!</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
