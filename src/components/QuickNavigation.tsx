
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Users, UserPlus, Zap, FileText, BarChart3, DollarSign, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const navigationItems = [
  {
    path: '/client-management',
    icon: Users,
    label: 'Clients',
    description: 'Manage client information'
  },
  {
    path: '/deal-registration',
    icon: UserPlus,
    label: 'Deals',
    description: 'Register new deals'
  },
  {
    path: '/circuit-quotes',
    icon: Zap,
    label: 'Circuits',
    description: 'Circuit pricing research'
  },
  {
    path: '/quoting-system',
    icon: FileText,
    label: 'Quotes',
    description: 'Create and manage quotes'
  },
  {
    path: '/circuit-tracking',
    icon: BarChart3,
    label: 'Tracking',
    description: 'Track circuit progress'
  },
  {
    path: '/billing',
    icon: DollarSign,
    label: 'Commission',
    description: 'Commission tracking'
  },
  {
    path: '/vendors',
    icon: Building2,
    label: 'Vendors',
    description: 'Vendor management'
  }
];

export const QuickNavigation = () => {
  const location = useLocation();
  const currentPath = location.pathname;

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
                          <Icon className="h-4 w-4" />
                          <span className="hidden sm:inline">{item.label}</span>
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
