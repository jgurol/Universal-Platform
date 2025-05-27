
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, ArrowRight } from "lucide-react";

export const OrdersCard = () => {
  return (
    <Card className="bg-white border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
            <FileText className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <CardTitle className="text-xl font-bold text-gray-900">Orders</CardTitle>
            <CardDescription className="text-gray-600">
              Manage orders and view signed agreements
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          <p className="text-gray-600 text-sm">
            Track orders created from approved quotes, view signed agreements, and manage order fulfillment.
          </p>
          <Link to="/orders" className="block">
            <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white group-hover:translate-x-1 transition-transform">
              Open Orders
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};
