import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Bell, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

interface NotificationPreferences {
  carrier_quote_generated: boolean;
  circuit_quote_researching: boolean;
  circuit_quote_completed: boolean;
  quote_sent_to_customer: boolean;
  customer_opens_email: boolean;
  customer_accepts_quote: boolean;
  deal_created_admin: boolean;
}

export const NotificationPreferences = () => {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    carrier_quote_generated: true,
    circuit_quote_researching: true,
    circuit_quote_completed: true,
    quote_sent_to_customer: true,
    customer_opens_email: true,
    customer_accepts_quote: true,
    deal_created_admin: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const { user, isAdmin } = useAuth();

  useEffect(() => {
    loadPreferences();
  }, [user]);

  const loadPreferences = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading preferences:', error);
        toast({
          title: "Error",
          description: "Failed to load notification preferences",
          variant: "destructive"
        });
      } else if (data) {
        setPreferences({
          carrier_quote_generated: data.carrier_quote_generated,
          circuit_quote_researching: data.circuit_quote_researching,
          circuit_quote_completed: data.circuit_quote_completed,
          quote_sent_to_customer: data.quote_sent_to_customer,
          customer_opens_email: data.customer_opens_email,
          customer_accepts_quote: data.customer_accepts_quote,
          deal_created_admin: data.deal_created_admin,
        });
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: user.id,
          ...preferences,
        });

      if (error) {
        console.error('Error saving preferences:', error);
        toast({
          title: "Error",
          description: "Failed to save notification preferences",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Success",
          description: "Notification preferences saved successfully"
        });
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast({
        title: "Error",
        description: "Failed to save notification preferences",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePreferenceChange = (key: keyof NotificationPreferences, checked: boolean) => {
    setPreferences(prev => ({
      ...prev,
      [key]: checked
    }));
  };

  const notificationOptions = [
    {
      key: 'carrier_quote_generated' as const,
      label: 'New carrier quote is generated',
      description: 'Get notified when a new carrier quote is added to a circuit quote'
    },
    {
      key: 'circuit_quote_researching' as const,
      label: 'Circuit quote is researching',
      description: 'Get notified when a circuit quote status changes to researching'
    },
    {
      key: 'circuit_quote_completed' as const,
      label: 'Circuit quote is completed',
      description: 'Get notified when a circuit quote is completed'
    },
    {
      key: 'quote_sent_to_customer' as const,
      label: 'Quote sent to customer',
      description: 'Get notified when a quote is sent to a customer'
    },
    {
      key: 'customer_opens_email' as const,
      label: 'Customer opens email',
      description: 'Get notified when a customer opens a quote email'
    },
    {
      key: 'customer_accepts_quote' as const,
      label: 'Customer accepts quote',
      description: 'Get notified when a customer accepts a quote'
    }
  ];

  const adminOnlyOptions = [
    {
      key: 'deal_created_admin' as const,
      label: 'Deal is created (Admin Only)',
      description: 'Get notified when a new deal is registered in the system'
    }
  ];

  const displayOptions = isAdmin ? [...notificationOptions, ...adminOnlyOptions] : notificationOptions;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notification Preferences
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Notification Preferences
        </CardTitle>
        <CardDescription>
          Choose which notifications you'd like to receive
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          {displayOptions.map((option) => (
            <div key={option.key} className="flex items-start space-x-3">
              <Checkbox
                id={option.key}
                checked={preferences[option.key]}
                onCheckedChange={(checked) => 
                  handlePreferenceChange(option.key, checked as boolean)
                }
              />
              <div className="grid gap-1.5 leading-none">
                <Label
                  htmlFor={option.key}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {option.label}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {option.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end">
          <Button 
            onClick={savePreferences} 
            disabled={saving}
            className="flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Preferences'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};