
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";
import { AddTemplateSection } from "./quote-templates/AddTemplateSection";
import { TemplatesList } from "./quote-templates/TemplatesList";

export const QuoteTemplatesTab: React.FC = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Quote Templates
          </CardTitle>
          <CardDescription>
            Manage terms and conditions templates that can be appended to quotes and included in PDFs
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <AddTemplateSection />
          <TemplatesList />
        </CardContent>
      </Card>
    </div>
  );
};
