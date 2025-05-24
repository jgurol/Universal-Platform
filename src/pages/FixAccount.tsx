
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Navigate, useNavigate } from "react-router-dom";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { makeJimGurolAdmin } from "@/utils/makeUserAdmin";

export default function FixAccount() {
  const { user, signOut, loading } = useAuth();
  const { toast } = useToast();
  const [updating, setUpdating] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  
  useEffect(() => {
    if (user?.email) {
      setUserEmail(user.email);
    }
  }, [user]);

  const makeAdmin = async () => {
    if (!user?.id) return;
    
    try {
      setUpdating(true);
      setError(null);
      
      // Use RPC call to bypass RLS policies
      const { error } = await supabase.rpc('make_user_admin', {
        user_id: user.id
      });
        
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Your account has been updated to admin. Please sign out and back in.",
      });
      
      // Sign out and redirect to auth page after successful update
      await signOut();
    } catch (error: any) {
      console.error("Error updating user:", error);
      setError(`Failed to update account: ${error.message}`);
      toast({
        title: "Error",
        description: `Failed to update account: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setUpdating(false);
    }
  };

  const makeAssociated = async () => {
    if (!user?.id) return;
    
    try {
      setUpdating(true);
      setError(null);
      
      // Use RPC call to bypass RLS policies
      const { error } = await supabase.rpc('make_user_associated', {
        user_id: user.id
      });
        
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Your account has been associated. Please sign out and back in.",
      });
      
      // Sign out and redirect to auth page after successful update
      await signOut();
    } catch (error: any) {
      console.error("Error updating user:", error);
      setError(`Failed to update account: ${error.message}`);
      toast({
        title: "Error",
        description: `Failed to update account: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setUpdating(false);
    }
  };

  const makeJimAdmin = async () => {
    try {
      setUpdating(true);
      setError(null);
      
      await makeJimGurolAdmin();
      
      toast({
        title: "Success",
        description: "Jim Gurol has been made an admin. Please refresh to see the changes.",
      });
    } catch (error: any) {
      console.error("Error making Jim admin:", error);
      setError(`Failed to make Jim admin: ${error.message}`);
      toast({
        title: "Error",
        description: `Failed to make Jim admin: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return <div className="h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/auth" />;
  }

  return (
    <div className="h-screen flex flex-col items-center justify-center p-4 text-center">
      <h1 className="text-2xl font-bold mb-2">Account Setup</h1>
      
      <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <p className="mb-2 font-medium">Current user: {userEmail}</p>
        <p className="text-sm text-gray-600">Your account needs to be set up to continue using the system.</p>
      </div>
      
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="flex flex-col gap-4 w-full max-w-md">
        <Button
          onClick={makeAdmin}
          disabled={updating}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Make Me Admin
        </Button>
        
        <Button
          onClick={makeAssociated}
          disabled={updating}
          variant="outline"
          className="border-green-500 text-green-600 hover:bg-green-50"
        >
          Make Me Associated Agent
        </Button>

        {userEmail === 'jim@californiatelecom.com' && (
          <Button
            onClick={makeJimAdmin}
            disabled={updating}
            className="bg-purple-600 hover:bg-purple-700"
          >
            Make Jim Gurol Admin
          </Button>
        )}
        
        <Button
          onClick={async () => await signOut()}
          variant="outline"
          className="mt-4 border-gray-300"
        >
          Sign Out
        </Button>
      </div>
    </div>
  );
}
