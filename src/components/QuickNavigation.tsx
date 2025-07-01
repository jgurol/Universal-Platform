
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Users, UserPlus, Zap, FileText, BarChart3, DollarSign, Target, Search, PhoneCall } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAppAccess } from '@/hooks/useAppAccess';

export const QuickNavigation = () => {
  const location = useLocation();
  const currentPath = location.pathname;
  const { userApps } = useAppAccess();

  // Map icon names to actual icon components
  const iconMap: Record<string, React.ComponentType<{ className?: string; color?: string }>> = {
    Users,
    Target: UserPlus,
    Search,
    FileText,
    Zap: BarChart3,
    DollarSign,
    PhoneCall
  };

  // Convert userApps to navigation items format
  const navigationItems = userApps.map(app => ({
    path: app.route,
    icon: iconMap[app.icon_name] || FileText,
    label: app.name,
    description: app.description,
    color: app.color
  }));

  // Don't render if no apps available
  if (navigationItems.length === 0) {
    return null;
  }

  return (
    <div className="bg-white border-b border-gray-200 py-3 px-4 mb-6">
      <div className="container mx-auto">
        <div className="flex items-center justify-center gap-2">
          <span className="text-sm text-gray-600 mr-4">Quick Navigate:</span>
          <TooltipProvider>
            <div className="flex gap-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPath === item.path;
                
                return (
                  <Tooltip key={item.path}>
                    <TooltipTrigger asChild>
                      <Button
                        variant={isActive ? "default" : "outline"}
                        size="sm"
                        asChild
                        className={isActive ? "bg-blue-600 hover:bg-blue-700" : ""}
                      >
                        <Link to={item.path} className="flex items-center gap-2">
                          <Icon 
                            className="h-4 w-4" 
                            color={isActive ? "white" : item.color}
                          />
                          <span className="hidden sm:inline" style={!isActive ? { color: item.color } : {}}>
                            {item.label}
                          </span>
                        </Link>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="text-center">
                        <p className="font-medium">{item.label}</p>
                        <p className="text-sm text-gray-500">{item.description}</p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
};
