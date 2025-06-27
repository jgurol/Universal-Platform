
import React from "react";
import { NavigationBar } from "@/components/NavigationBar";
import { Header } from "@/components/Header";
import { ProgramsGrid } from "@/components/ProgramsGrid";
import { StatsCards } from "@/components/StatsCards";
import { RecentQuotes } from "@/components/RecentQuotes";
import { RecentTransactions } from "@/components/RecentTransactions";
import { CommissionChart } from "@/components/CommissionChart";
import { AgentSummary } from "@/components/AgentSummary";

export const IndexPageLayout = () => {
  return (
    <div>
      <NavigationBar />
      <div className="container mx-auto px-4 py-8">
        <Header />
        <StatsCards />
        <ProgramsGrid />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          <RecentQuotes />
          <RecentTransactions />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          <CommissionChart />
          <AgentSummary />
        </div>
      </div>
    </div>
  );
};
