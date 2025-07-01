
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useAppAccess } from '@/hooks/useAppAccess';
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
import { Settings, Users, FileText, Home, UserPlus, Building, UserCog, Zap, LogOut, User, Package } from 'lucide-react';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

export function NavigationBar() {
  const { isAdmin, user, signOut, userProfile } = useAuth();
  const { userApps } = useAppAccess();
  const { toast } = useToast();

  const handleSignOut = async () => {
    try {
      console.log('NavigationBar: Starting sign out');
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: "Sign Out Error",
        description: "There was an error signing out. Redirecting to login page.",
        variant: "destructive"
      });
      // Force redirect even if there's an error
      window.location.href = '/auth';
    }
  };

  const getDisplayName = () => {
    if (userProfile?.full_name) {
      return userProfile.full_name;
    }
    return user?.email?.split('@')[0] || '';
  };

  const getUserInitials = (name: string) => {
    if (!name) return 'U';
    
    const words = name.trim().split(' ');
    if (words.length >= 2) {
      return (words[0][0] + words[words.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

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

        <div className="flex items-center gap-4">
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <Link to="/">
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                    Dashboard
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>

              {userApps.length > 0 && (
                <NavigationMenuItem>
                  <NavigationMenuTrigger>Applications</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[300px] gap-3 p-4">
                      {userApps.map((app) => {
                        const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
                          Users,
                          Target: UserPlus,
                          Search: Zap,
                          FileText,
                          Zap,
                          DollarSign: Package
                        };
                        const IconComponent = iconMap[app.icon_name] || FileText;
                        
                        return (
                          <ListItem key={app.id} href={app.route} title={app.name} Icon={IconComponent}>
                            {app.description}
                          </ListItem>
                        );
                      })}
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              )}

              {isAdmin && (
                <NavigationMenuItem>
                  <NavigationMenuTrigger>System Settings</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[300px] gap-3 p-4">
                      <ListItem href="/orders-management" title="Orders Management" Icon={Package}>
                        Manage and track customer orders
                      </ListItem>
                      
                      <ListItem href="/templates" title="Templates" Icon={FileText}>
                        Manage quote templates and terms & conditions
                      </ListItem>
                      
                      <ListItem href="/vendors" title="Vendor Management" Icon={Building}>
                        Manage vendors and supplier information
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
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              )}
            </NavigationMenuList>
          </NavigationMenu>

          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-blue-100 text-blue-700 font-medium">
                      {getUserInitials(getDisplayName())}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {getDisplayName()}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/settings/profile" className="flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    Profile Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="flex items-center text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
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
