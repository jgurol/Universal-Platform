
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings, ArrowRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export const SettingsCard = () => {
  const { isAdmin } = useAuth();
  
  return (
    <Card className="bg-white border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-gray-200 transition-colors">
            <Settings className="w-6 h-6 text-gray-600" />
          </div>
          <div>
            <CardTitle className="text-xl font-bold text-gray-900">Settings</CardTitle>
            <CardDescription className="text-gray-600">
              {isAdmin ? "System and profile settings" : "Profile settings"}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          <p className="text-gray-600 text-sm">
            {isAdmin 
              ? "Configure system settings, manage users, and update your profile." 
              : "Update your profile information and preferences."
            }
          </p>
          <Link to={isAdmin ? "/system-settings" : "/profile-settings"} className="block">
            <Button className="w-full bg-gray-600 hover:bg-gray-700 text-white group-hover:translate-x-1 transition-transform">
              Open Settings
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};
