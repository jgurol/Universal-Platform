
import React from 'react';
import { NavigationBar } from '@/components/NavigationBar';
import { QuickNavigation } from '@/components/QuickNavigation';
import { LNPPortingContent } from '@/components/LNPPortingContent';

const LNPPorting = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <NavigationBar />
      <QuickNavigation />
      <div className="container mx-auto px-4 py-8">
        <LNPPortingContent />
      </div>
    </div>
  );
};

export default LNPPorting;
