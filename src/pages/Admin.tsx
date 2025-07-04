import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { NavigationBar } from '@/components/NavigationBar';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Shield, UserCheck, UserX, PencilIcon, Plus, Mail, Trash2, Package } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { EditUserDialog } from '@/components/EditUserDialog';
import { AssociateUserDialog } from '@/components/AssociateUserDialog';
import { AddUserDialog } from '@/components/AddUserDialog';
import { DeleteUserDialog } from '@/components/DeleteUserDialog';
import { UserAppAccessDialog } from '@/components/UserAppAccessDialog';
import { useSystemSettings } from '@/context/SystemSettingsContext';

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: string; 
  is_associated: boolean;
  created_at: string;
  associated_agent_name: string | null;
  associated_agent_id: string | null;
  last_sign_in_at: string | null;
}

interface Agent {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  company_name: string | null;
}

interface AuthUser {
  id: string;
  last_sign_in_at?: string;
  email?: string;
}

export default function Admin() {
  const { isAdmin, user } = useAuth();
  const { toast } = useToast();
  const { settings } = useSystemSettings();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [associatingUser, setAssociatingUser] = useState<UserProfile | null>(null);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [deletingUser, setDeletingUser] = useState<UserProfile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [appAccessUser, setAppAccessUser] = useState<UserProfile | null>(null);

  // Redirect non-admin users
  if (!isAdmin) {
    return <Navigate to="/" />;
  }

  useEffect(() => {
    fetchUsers();
    fetchAgents();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Fetch users with associated agent information
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('id, email, full_name, role, is_associated, created_at, associated_agent_id');

      if (usersError) throw usersError;

      // Fetch agents data to get company names
      const { data: agentsData, error: agentsError } = await supabase
        .from('agents')
        .select('id, company_name');

      if (agentsError) throw agentsError;

      // Fetch last login data for each user
      const usersWithAgentInfo = await Promise.all(
        (usersData || []).map(async (user) => {
          const agent = agentsData?.find(a => a.id === user.associated_agent_id);
          
          // Get last login from login_logs table
          const { data: lastLoginData } = await supabase
            .rpc('get_user_last_login', { user_uuid: user.id });
          
          return {
            ...user,
            associated_agent_name: agent?.company_name || null,
            last_sign_in_at: lastLoginData || null
          };
        })
      );

      setUsers(usersWithAgentInfo);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: `Failed to fetch users: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAgents = async () => {
    try {
      const { data, error } = await supabase
        .from('agents')
        .select('id, email, first_name, last_name, company_name');

      if (error) throw error;

      console.log("Fetched agents from agents table:", data);
      setAgents(data || []);
    } catch (error: any) {
      console.error('Error fetching agents:', error);
      toast({
        title: "Error",
        description: `Failed to fetch agents: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  const formatLastLogin = (lastSignInAt: string | null) => {
    if (!lastSignInAt) return 'Never';
    
    try {
      // Parse the UTC timestamp
      const utcDate = new Date(lastSignInAt);
      
      // Get the configured timezone from system settings
      const userTimezone = settings.timezone || 'America/Los_Angeles';
      
      console.log('Original UTC timestamp:', lastSignInAt);
      console.log('Parsed UTC date:', utcDate);
      console.log('User timezone:', userTimezone);
      
      // Format as MM/DD HH:MM AM/PM in the user's timezone
      const formattedDate = utcDate.toLocaleDateString("en-US", { 
        timeZone: userTimezone,
        month: '2-digit',
        day: '2-digit'
      });
      
      const formattedTime = utcDate.toLocaleTimeString("en-US", { 
        timeZone: userTimezone,
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true
      });
      
      return `${formattedDate} ${formattedTime}`;
    } catch (error) {
      console.error('Error formatting last login date:', error);
      return 'Invalid date';
    }
  };

  const updateUserAssociation = async (userId: string, associate: boolean) => {
    try {
      // If we're disassociating, also remove the associated_agent_id
      const updates = associate 
        ? { is_associated: associate }
        : { is_associated: associate, associated_agent_id: null };
        
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId);

      if (error) throw error;

      // Update local state
      setUsers(users.map(u => 
        u.id === userId 
          ? { ...u, is_associated: associate, associated_agent_id: associate ? u.associated_agent_id : null, associated_agent_name: associate ? u.associated_agent_name : null } 
          : u
      ));

      toast({
        title: "Success",
        description: `User ${associate ? 'associated' : 'disassociated'} successfully`,
      });
    } catch (error: any) {
      console.error('Error updating user:', error);
      toast({
        title: "Error",
        description: `Failed to update user: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  const handleEditUser = (user: UserProfile) => {
    setEditingUser(user);
  };

  const handleAssociateUser = (user: UserProfile) => {
    setAssociatingUser(user);
  };

  const handleUpdateUser = (updatedUser: UserProfile) => {
    // Update local state
    setUsers(users.map(u => 
      u.id === updatedUser.id ? updatedUser : u
    ));

    // Close the dialogs
    setEditingUser(null);
    setAssociatingUser(null);
  };

  const handleUserAdded = () => {
    fetchUsers();
    setIsAddUserOpen(false);
  };

  const sendResetEmail = async (userProfile: UserProfile) => {
    try {
      console.log('Sending custom password reset request for admin user:', userProfile.email);
      
      // Use our custom edge function
      const { data, error } = await supabase.functions.invoke('send-password-reset', {
        body: { email: userProfile.email }
      });

      if (error) {
        console.error('Custom password reset error:', error);
        throw error;
      }

      console.log('Custom password reset response:', data);
      
      toast({
        title: "Password reset sent",
        description: `Reset email sent to ${userProfile.email}`,
      });
    } catch (error: any) {
      console.error('Error sending reset email:', error);
      toast({
        title: "Error",
        description: `Failed to send reset email: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) return;

    try {
      setIsDeleting(true);
      
      console.log('Calling delete-user edge function for:', deletingUser.id);
      
      // Use our custom edge function to delete the user
      const { data, error } = await supabase.functions.invoke('delete-user', {
        body: { userId: deletingUser.id }
      });

      if (error) {
        console.error('Error calling delete-user function:', error);
        toast({
          title: "Error",
          description: `Failed to delete user: ${error.message}`,
          variant: "destructive"
        });
        return;
      }

      if (!data?.success) {
        console.error('Delete user function returned error:', data?.error);
        toast({
          title: "Error",
          description: `Failed to delete user: ${data?.error || 'Unknown error'}`,
          variant: "destructive"
        });
        return;
      }

      // Remove from local state
      setUsers(users.filter(u => u.id !== deletingUser.id));
      
      toast({
        title: "Success",
        description: `User ${deletingUser.full_name || deletingUser.email} has been deleted successfully`,
      });
      
      setDeletingUser(null);
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: `Failed to delete user: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="container mx-auto p-4 min-h-screen">
      <NavigationBar />
      
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <div className="flex items-center gap-2">
          <Button onClick={() => setIsAddUserOpen(true)} className="bg-green-600 hover:bg-green-700">
            <Plus className="h-4 w-4 mr-2" />
            Add User
          </Button>
          <Button onClick={() => { fetchUsers(); fetchAgents(); }} disabled={loading}>
            {loading ? 'Loading...' : 'Refresh'}
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-10 text-center">Loading users...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Associated With</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                users.map((userProfile) => (
                  <TableRow key={userProfile.id} className={userProfile.id === user?.id ? "bg-blue-50" : ""}>
                    <TableCell>{userProfile.full_name || 'No name'}</TableCell>
                    <TableCell>{userProfile.email}</TableCell>
                    <TableCell>
                      {userProfile.role === 'admin' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                          <Shield className="w-3 h-3" />
                          Admin
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                          Agent
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {userProfile.is_associated ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                          <UserCheck className="w-3 h-3" />
                          Associated
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 rounded text-xs">
                          <UserX className="w-3 h-3" />
                          Not Associated
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {userProfile.associated_agent_name ? (
                        <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                          {userProfile.associated_agent_name}
                        </span>
                      ) : (
                        <span className="text-gray-500 text-xs">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600">
                        {formatLastLogin(userProfile.last_sign_in_at)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditUser(userProfile)}
                          className="text-blue-600 hover:bg-blue-50"
                        >
                          <PencilIcon className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setAppAccessUser(userProfile)}
                          className="text-green-600 hover:bg-green-50"
                        >
                          <Package className="w-4 h-4 mr-1" />
                          Apps
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => sendResetEmail(userProfile)}
                          className="text-purple-600 hover:bg-purple-50"
                        >
                          <Mail className="w-4 h-4 mr-1" />
                          Reset
                        </Button>
                        
                        {userProfile.id !== user?.id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeletingUser(userProfile)}
                            className="text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 w-4 mr-1" />
                            Delete
                          </Button>
                        )}
                        
                        {userProfile.role === 'agent' && userProfile.id !== user?.id && (
                          <>
                            {userProfile.is_associated ? (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => updateUserAssociation(userProfile.id, false)}
                                className="text-red-600 border-red-200 hover:bg-red-50"
                              >
                                <UserX className="w-4 h-4 mr-1" />
                                Disassociate
                              </Button>
                            ) : (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleAssociateUser(userProfile)}
                                className="text-green-600 border-green-200 hover:bg-green-50"
                              >
                                <UserCheck className="w-4 h-4 mr-1" />
                                Associate
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </div>

      <AddUserDialog
        agents={agents}
        open={isAddUserOpen}
        onOpenChange={setIsAddUserOpen}
        onUserAdded={handleUserAdded}
      />

      {editingUser && (
        <EditUserDialog
          user={editingUser}
          agents={agents}
          open={!!editingUser}
          onOpenChange={(open) => {
            if (!open) setEditingUser(null);
          }}
          onUpdateUser={handleUpdateUser}
        />
      )}

      {associatingUser && (
        <AssociateUserDialog
          user={associatingUser}
          agents={agents}
          open={!!associatingUser}
          onOpenChange={(open) => {
            if (!open) setAssociatingUser(null);
          }}
          onUpdateUser={handleUpdateUser}
        />
      )}

      <DeleteUserDialog
        user={deletingUser}
        open={!!deletingUser}
        onOpenChange={(open) => {
          if (!open) setDeletingUser(null);
        }}
        onConfirmDelete={handleDeleteUser}
        isDeleting={isDeleting}
      />

      {appAccessUser && (
        <UserAppAccessDialog
          user={appAccessUser}
          open={!!appAccessUser}
          onOpenChange={(open) => {
            if (!open) setAppAccessUser(null);
          }}
        />
      )}
    </div>
  );
}
