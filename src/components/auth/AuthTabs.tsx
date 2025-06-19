
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoginForm } from "@/components/auth/LoginForm";
import { RegisterForm } from "@/components/auth/RegisterForm";

interface AuthTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogin: (email: string, password: string) => Promise<void>;
  onRegister: (email: string, password: string, fullName: string) => Promise<void>;
  onForgotPassword: () => void;
  isSubmitting: boolean;
}

export const AuthTabs = ({
  activeTab,
  onTabChange,
  onLogin,
  onRegister,
  onForgotPassword,
  isSubmitting
}: AuthTabsProps) => {
  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-6">
        <TabsTrigger value="login">Login</TabsTrigger>
        <TabsTrigger value="register">Register</TabsTrigger>
      </TabsList>

      <TabsContent value="login">
        <LoginForm 
          onLogin={onLogin}
          onForgotPassword={onForgotPassword}
          isSubmitting={isSubmitting}
        />
      </TabsContent>

      <TabsContent value="register">
        <RegisterForm
          onRegister={onRegister}
          isSubmitting={isSubmitting}
        />
      </TabsContent>
    </Tabs>
  );
};
