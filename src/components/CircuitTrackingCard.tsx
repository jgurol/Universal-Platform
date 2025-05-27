
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Zap, ArrowRight } from "lucide-react";

export const CircuitTrackingCard = () => {
  return (
    <Card className="bg-white border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-yellow-100 rounded-lg group-hover:bg-yellow-200 transition-colors">
            <Zap className="w-6 h-6 text-yellow-600" />
          </div>
          <div>
            <CardTitle className="text-xl font-bold text-gray-900">Circuit Tracking</CardTitle>
            <CardDescription className="text-gray-600">
              Monitor circuit installation progress
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          <p className="text-gray-600 text-sm">
            Track the progress of circuit installations and manage project milestones.
          </p>
          <Link to="/circuit-tracking" className="block">
            <Button className="w-full bg-yellow-600 hover:bg-yellow-700 text-white group-hover:translate-x-1 transition-transform">
              Open Circuit Tracking
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};
