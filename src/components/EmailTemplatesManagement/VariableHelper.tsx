
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getAvailableVariables } from "@/utils/emailTemplateVariables";

interface VariableHelperProps {
  onVariableInsert?: (variable: string) => void;
}

export const VariableHelper = ({ onVariableInsert }: VariableHelperProps) => {
  const { toast } = useToast();
  const variables = getAvailableVariables();

  const copyToClipboard = (variable: string) => {
    navigator.clipboard.writeText(variable);
    toast({
      title: "Copied to clipboard",
      description: `Variable ${variable} copied to clipboard`,
    });
  };

  const handleInsert = (variable: string) => {
    if (onVariableInsert) {
      onVariableInsert(variable);
    } else {
      copyToClipboard(variable);
    }
  };

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-gray-700">Available Variables:</h4>
      <div className="grid grid-cols-2 gap-2">
        {variables.map((variable) => (
          <div key={variable} className="flex items-center justify-between p-2 bg-gray-50 rounded border">
            <Badge variant="secondary" className="text-xs">
              {variable}
            </Badge>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => handleInsert(variable)}
              className="h-6 w-6 p-0"
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-500">
        Click the copy icon to copy a variable to your clipboard, then paste it into your template.
      </p>
    </div>
  );
};
