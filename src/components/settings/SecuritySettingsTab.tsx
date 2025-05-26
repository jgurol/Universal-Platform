
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Shield, Settings, AlertTriangle } from "lucide-react";

export const SecuritySettingsTab: React.FC = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Settings
          </CardTitle>
          <CardDescription>
            Configure security and access control settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium">Authentication Method:</span>
            </div>
            <span className="text-sm text-gray-600">Email & Password</span>
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium">User Registration:</span>
            </div>
            <span className="text-sm text-gray-600">Enabled (Admin Approval Required)</span>
          </div>
        </CardContent>
      </Card>

      <Card className="border-orange-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-700">
            <AlertTriangle className="h-5 w-5" />
            Database Management
          </CardTitle>
          <CardDescription>
            Advanced database operations and maintenance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-orange-50 p-4 rounded-lg">
            <p className="text-sm text-orange-700 mb-2">
              <strong>Warning:</strong> These operations can affect system performance and data integrity.
            </p>
            <p className="text-sm text-orange-600">
              Database maintenance and backup operations should be performed during off-peak hours.
              Contact your system administrator for assistance with these operations.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
