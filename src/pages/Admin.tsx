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
import { Shield, UserCheck, UserX, PencilIcon, Plus, Mail } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { EditUserDialog } from '@/components/EditUserDialog';
import { AssociateUserDialog } from '@/components/AssociateUserDialog';
import { AddUserDialog } from '@/components/AddUserDialog';

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: string; 
  is_associated: boolean;
  created_at: string;
  associated_agent_name: string | null;
  associated_agent_id: string | null;
}

interface Agent {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  company_name: string | null;
}

export default function Admin() {
  const { isAdmin, user } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [associatingUser, setAssociatingUser] = useState<UserProfile | null>(null);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [agents, setAgents] = useState<Agent[]>([]);

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

      // Merge the data to include company names as associated_agent_name
      const usersWithAgentInfo = usersData?.map(user => {
        const agent = agentsData?.find(a => a.id === user.associated_agent_id);
        return {
          ...user,
          associated_agent_name: agent?.company_name || null
        };
      }) || [];

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
      // Send password reset email via Supabase Auth
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(userProfile.email, {
        redirectTo: `${window.location.origin}/auth`
      });

      if (resetError) throw resetError;

      // Also send our custom notification email
      try {
        const { error: emailError } = await supabase.functions.invoke('send-user-email', {
          body: {
            email: userProfile.email,
            fullName: userProfile.full_name || 'User',
            type: 'reset',
          }
        });

        if (emailError) {
          console.error("Error sending notification email:", emailError);
        }
      } catch (emailError) {
        console.error("Error sending notification email:", emailError);
      }

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
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
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
                          onClick={() => sendResetEmail(userProfile)}
                          className="text-purple-600 hover:bg-purple-50"
                        >
                          <Mail className="w-4 h-4 mr-1" />
                          Reset
                        </Button>
                        
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
    </div>
  );
}
