import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { NavigationBar } from "@/components/NavigationBar";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { User, Mail, Shield, Building, Clock, Bell } from "lucide-react";
import { updateUserTimezone, getAppTimezone } from "@/utils/dateUtils";
import { NotificationPreferences } from "@/components/NotificationPreferences";

const timezones = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Anchorage', label: 'Alaska Time (AKT)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (HST)' },
];

export default function ProfileSettings() {
  const { user, isAdmin, refreshUserProfile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({
    full_name: "",
    email: "",
    role: "",
    timezone: "America/Los_Angeles"
  });
  const [associatedCompany, setAssociatedCompany] = useState<string>("");

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, email, role, associated_agent_id, timezone')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }

      if (data) {
        setProfile({
          full_name: data.full_name || "",
          email: data.email || user.email || "",
          role: data.role || "",
          timezone: data.timezone || "America/Los_Angeles"
        });

        // Fetch associated agent's company name if user has an associated agent
        if (data.associated_agent_id) {
          fetchAssociatedCompany(data.associated_agent_id);
        }
      }
    } catch (error) {
      console.error('Error in profile fetch:', error);
    }
  };

  const fetchAssociatedCompany = async (agentId: string) => {
    try {
      const { data, error } = await supabase
        .from('agents')
        .select('company_name, first_name, last_name')
        .eq('id', agentId)
        .single();

      if (error) {
        console.error('Error fetching associated company:', error);
        return;
      }

      if (data) {
        // Use company name if available, otherwise use agent's full name
        const companyName = data.company_name || `${data.first_name} ${data.last_name}`;
        setAssociatedCompany(companyName);
      }
    } catch (error) {
      console.error('Error fetching associated company:', error);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profile.full_name,
          email: profile.email,
          timezone: profile.timezone
        })
        .eq('id', user.id);

      if (error) {
        toast({
          title: "Update failed",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      // Update timezone cache
      await updateUserTimezone(profile.timezone);

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
      });

      await refreshUserProfile();
    } catch (error: any) {
      toast({
        title: "Update error",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto py-8">
        <NavigationBar />
        <div className="text-center">
          <p>Please log in to access profile settings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <NavigationBar />
      
      <div className="container mx-auto py-8 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile Settings</h1>
          <p className="text-gray-600">Manage your account information and preferences</p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </CardTitle>
              <CardDescription>
                Update your personal details and contact information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    value={profile.full_name}
                    onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                    placeholder="Enter your full name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    placeholder="Enter your email address"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select 
                    value={profile.timezone} 
                    onValueChange={(value) => setProfile({ ...profile, timezone: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      {timezones.map((tz) => (
                        <SelectItem key={tz.value} value={tz.value}>
                          {tz.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button type="submit" disabled={loading}>
                  {loading ? "Updating..." : "Update Profile"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Account Information
              </CardTitle>
              <CardDescription>
                Your account details and permissions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">Login Email:</span>
                </div>
                <span className="text-sm text-gray-600">{user.email}</span>
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">Role:</span>
                </div>
                <span className={`text-sm px-2 py-1 rounded ${
                  isAdmin ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                }`}>
                  {profile.role || 'Loading...'}
                </span>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">Current Timezone:</span>
                </div>
                <span className="text-sm text-gray-600">
                  {timezones.find(tz => tz.value === profile.timezone)?.label || profile.timezone}
                </span>
              </div>

              {associatedCompany && (
                <>
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium">Associated Company:</span>
                    </div>
                    <span className="text-sm text-gray-600">{associatedCompany}</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <NotificationPreferences />
        </div>
      </div>
    </div>
  );
}
