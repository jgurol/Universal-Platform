
import React from 'react';
import { NavigationBar } from '@/components/NavigationBar';
import { QuickNavigation } from '@/components/QuickNavigation';
import { DIDManagementContent } from '@/components/DIDManagementContent';

const DIDManagement = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <NavigationBar />
      <QuickNavigation />
      
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <DIDManagementContent />
      </div>
    </div>
  );
};

export default DIDManagement;
