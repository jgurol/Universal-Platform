
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";
import { Settings, Users, FileText, Home, UserPlus, Building, UserCog, CreditCard, Zap } from 'lucide-react';

export function NavigationBar() {
  const { isAdmin } = useAuth();

  return (
    <div className="w-full bg-white border-b border-gray-200 py-2 px-4 mb-6">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="flex items-center gap-3">
          <img 
            src="/lovable-uploads/7d6b9f8c-8f4e-44f2-9863-627836260cf9.png" 
            alt="California Telecom" 
            className="h-12 w-auto"
          />
          <h1 className="text-2xl font-bold text-gray-900">Universal Platform</h1>
        </Link>

        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <Link to="/">
                <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                  Dashboard
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <Link to="/quoting-system">
                <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                  Quoting System
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <Link to="/orders">
                <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                  Orders
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <Link to="/circuit-tracking">
                <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                  Circuit Tracking
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavigationMenuTrigger>System Settings</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-[300px] gap-3 p-4">
                  <ListItem href="/settings/profile" title="Profile Settings" Icon={Settings}>
                    Manage your account preferences and personal information
                  </ListItem>
                  
                  <ListItem href="/settings/billing" title="Billing & Subscriptions" Icon={CreditCard}>
                    Manage your subscription, payment methods, and billing history
                  </ListItem>
                  
                  {isAdmin && (
                    <>
                      <ListItem href="/client-management" title="Client Management" Icon={Building}>
                        Manage your clients' information and details
                      </ListItem>
                      
                      <ListItem href="/agent-management" title="Agent Management" Icon={UserCog}>
                        Manage commission agents and their rates
                      </ListItem>
                      
                      <ListItem href="/admin" title="User Management" Icon={Users}>
                        Manage users, set permissions, and control access
                      </ListItem>
                      
                      <ListItem href="/system-settings" title="System Configuration" Icon={Settings}>
                        Configure global system settings and defaults
                      </ListItem>
                    </>
                  )}
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </div>
    </div>
  );
}

interface ListItemProps {
  href: string;
  title: string;
  children: React.ReactNode;
  Icon: React.ComponentType<{ className?: string }>;
}

const ListItem = ({ href, title, children, Icon }: ListItemProps) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <Link
          to={href}
          className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-blue-50 hover:text-blue-900 focus:bg-blue-50 focus:text-blue-900"
        >
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-blue-600" />
            <div className="text-sm font-medium leading-none">{title}</div>
          </div>
          <p className="line-clamp-2 text-sm leading-snug text-gray-500">
            {children}
          </p>
        </Link>
      </NavigationMenuLink>
    </li>
  );
};
