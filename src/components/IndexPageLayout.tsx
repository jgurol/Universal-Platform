
import React from "react";
import { NavigationBar } from "@/components/NavigationBar";
import { QuickNavigation } from "@/components/QuickNavigation";
import { AppAccessGrid } from "@/components/AppAccessGrid";
import { StatsCards } from "@/components/StatsCards";
import { RecentQuotes } from "@/components/RecentQuotes";
import { RecentTransactions } from "@/components/RecentTransactions";
import { useAuth } from "@/context/AuthContext";

export const IndexPageLayout: React.FC = () => {
  const { userProfile } = useAuth();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <NavigationBar />
      <QuickNavigation />
      
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Welcome back{userProfile?.full_name ? `, ${userProfile.full_name}` : ''}
          </h1>
          <p className="text-xl text-gray-600">
            Here's what's happening with your business today.
          </p>
        </div>

        {/* Programs Grid - Now using app access */}
        <AppAccessGrid />

        {/* Stats Cards */}
        <StatsCards />

        {/* Recent Activity Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <RecentQuotes />
          <RecentTransactions />
        </div>
      </div>
    </div>
  );
};
