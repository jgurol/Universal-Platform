
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Phone, Trash2 } from 'lucide-react';
import { useDIDNumbers } from '@/hooks/useDIDNumbers';
import { AddDIDDialog } from '@/components/AddDIDDialog';
import { AssignDIDDialog } from '@/components/AssignDIDDialog';
import { DeleteDIDDialog } from '@/components/DeleteDIDDialog';

export const DIDManagementContent = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'assigned'>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [assigningDID, setAssigningDID] = useState<any>(null);
  const [deletingDID, setDeletingDID] = useState<any>(null);
  
  const { didNumbers, loading, addDIDNumber, assignDIDToClient, releaseDID, deleteDID } = useDIDNumbers();

  const filteredDIDs = didNumbers.filter(did => {
    const matchesSearch = did.did_number.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || did.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'assigned': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDIDNumber = (didNumber: string) => {
    // Format as (XXX) XXX-XXXX
    return `(${didNumber.slice(0, 3)}) ${didNumber.slice(3, 6)}-${didNumber.slice(6)}`;
  };

  const handleDeleteConfirm = () => {
    if (deletingDID) {
      deleteDID(deletingDID.id);
      setDeletingDID(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="ml-2 text-gray-600">Loading DID numbers...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">DID Management</h1>
          <p className="text-gray-600 mt-1">Manage your VOIP DID numbers inventory</p>
        </div>
        <Button 
          onClick={() => setIsAddDialogOpen(true)}
          className="bg-green-600 hover:bg-green-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add DID Number
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total DIDs</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-gray-900">{didNumbers.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Available</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-green-600">
              {didNumbers.filter(d => d.status === 'available').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Assigned</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-blue-600">
              {didNumbers.filter(d => d.status === 'assigned').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search DID numbers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('all')}
                size="sm"
              >
                All
              </Button>
              <Button
                variant={statusFilter === 'available' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('available')}
                size="sm"
              >
                Available
              </Button>
              <Button
                variant={statusFilter === 'assigned' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('assigned')}
                size="sm"
              >
                Assigned
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* DID Numbers List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="w-5 h-5" />
            DID Numbers ({filteredDIDs.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredDIDs.length === 0 ? (
            <div className="text-center py-12">
              <Phone className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No DID numbers found</h3>
              <p className="text-gray-600">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filter criteria.' 
                  : 'Get started by adding your first DID number.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredDIDs.map((did) => (
                <div key={did.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="font-mono text-lg font-medium">
                        {formatDIDNumber(did.did_number)}
                      </span>
                    </div>
                    <Badge className={getStatusColor(did.status)}>
                      {did.status}
                    </Badge>
                    {did.client_info && (
                      <span className="text-sm text-gray-600">
                        → {did.client_info.company_name}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {did.status === 'available' ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setAssigningDID(did)}
                      >
                        Assign
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => releaseDID(did.id)}
                      >
                        Release
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeletingDID(did)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <AddDIDDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onAddDID={addDIDNumber}
      />

      {assigningDID && (
        <AssignDIDDialog
          did={assigningDID}
          open={!!assigningDID}
          onOpenChange={(open) => !open && setAssigningDID(null)}
          onAssignDID={assignDIDToClient}
        />
      )}

      <DeleteDIDDialog
        did={deletingDID}
        open={!!deletingDID}
        onOpenChange={(open) => !open && setDeletingDID(null)}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
};
