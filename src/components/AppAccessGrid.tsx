
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Zap, Search, DollarSign, Target, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { useAppAccess, type App } from "@/hooks/useAppAccess";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Users,
  Target,
  Search,
  FileText,
  Zap,
  DollarSign
};

export const AppAccessGrid = () => {
  const { userApps, loading } = useAppAccess();

  if (loading) {
    return (
      <div className="mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="bg-white shadow-lg border-0 h-full animate-pulse">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-gray-200 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mx-auto"></div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (userApps.length === 0) {
    return (
      <div className="mb-8">
        <Card className="bg-white shadow-lg border-0">
          <CardContent className="text-center py-12">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Apps Available</h3>
            <p className="text-gray-600">Contact your administrator to get access to applications.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        {userApps.map((app) => {
          const IconComponent = iconMap[app.icon_name] || FileText;
          
          return (
            <Link key={app.id} to={app.route} className="group">
              <Card className="bg-white shadow-lg border-0 transition-all duration-300 h-full hover:shadow-xl cursor-pointer transform hover:scale-105">
                <CardHeader className="text-center pb-4">
                  <div 
                    className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110"
                    style={{ backgroundColor: app.color }}
                  >
                    <IconComponent className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {app.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <CardDescription className="text-center text-sm text-gray-600">
                    {app.description}
                  </CardDescription>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
