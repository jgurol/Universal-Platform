
export interface TemplateVariables {
  quoteNumber?: string;
  clientFirstName?: string;
  clientLastName?: string;
  salesPerson?: string;
  companyName?: string;
  quoteAmount?: string;
  quoteDescription?: string;
}

export const replaceTemplateVariables = (template: string, variables: TemplateVariables): string => {
  let result = template;
  
  // Replace all template variables
  if (variables.quoteNumber) {
    result = result.replace(/\{\{quoteNumber\}\}/g, variables.quoteNumber);
  }
  if (variables.clientFirstName) {
    result = result.replace(/\{\{clientFirstName\}\}/g, variables.clientFirstName);
  }
  if (variables.clientLastName) {
    result = result.replace(/\{\{clientLastName\}\}/g, variables.clientLastName);
  }
  if (variables.salesPerson) {
    result = result.replace(/\{\{salesPerson\}\}/g, variables.salesPerson);
  }
  if (variables.companyName) {
    result = result.replace(/\{\{companyName\}\}/g, variables.companyName);
  }
  if (variables.quoteAmount) {
    result = result.replace(/\{\{quoteAmount\}\}/g, variables.quoteAmount);
  }
  if (variables.quoteDescription) {
    result = result.replace(/\{\{quoteDescription\}\}/g, variables.quoteDescription);
  }
  
  return result;
};

export const getAvailableVariables = (): string[] => {
  return [
    '{{quoteNumber}}',
    '{{clientFirstName}}',
    '{{clientLastName}}',
    '{{salesPerson}}',
    '{{companyName}}',
    '{{quoteAmount}}',
    '{{quoteDescription}}'
  ];
};
