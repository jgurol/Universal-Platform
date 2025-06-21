
import { Category } from "@/types/categories";

export interface MarkupCommissionCalculation {
  minimumMarkup: number;
  currentMarkup: number;
  maxMarkupReduction: number;
  commissionReduction: number;
  finalCommissionRate: number;
  isValid: boolean;
  errorMessage?: string;
}

export const calculateMarkupAndCommission = (
  cost: number,
  sellPrice: number,
  currentCommissionRate: number,
  category?: Category,
  agentCommissionRate: number = 15
): MarkupCommissionCalculation => {
  // Calculate the effective minimum markup after commission reduction
  const originalMinimumMarkup = category?.minimum_markup || 0;
  const commissionReduction = agentCommissionRate - currentCommissionRate;
  const effectiveMinimumMarkup = Math.max(0, originalMinimumMarkup - commissionReduction);
  
  const currentMarkup = cost > 0 ? ((sellPrice - cost) / cost) * 100 : 0;
  
  // Calculate how much the agent can reduce the markup (limited by their commission rate)
  const maxMarkupReduction = Math.min(effectiveMinimumMarkup, agentCommissionRate);
  
  // Calculate commission reduction based on markup reduction below effective minimum
  const markupReduction = Math.max(0, effectiveMinimumMarkup - currentMarkup);
  const additionalCommissionReduction = Math.min(markupReduction, currentCommissionRate);
  
  // Final commission rate after all reductions
  const finalCommissionRate = Math.max(0, currentCommissionRate - additionalCommissionReduction);
  
  // Validate if the current markup is acceptable
  const isValid = currentMarkup >= 0 && (commissionReduction + additionalCommissionReduction) <= agentCommissionRate;
  
  let errorMessage: string | undefined;
  if (currentMarkup < 0) {
    errorMessage = "Sell price cannot be below cost";
  } else if ((commissionReduction + additionalCommissionReduction) > agentCommissionRate) {
    errorMessage = `Reducing markup below ${effectiveMinimumMarkup}% would require more commission reduction than available (${agentCommissionRate}%)`;
  }

  return {
    minimumMarkup: effectiveMinimumMarkup,
    currentMarkup,
    maxMarkupReduction,
    commissionReduction: commissionReduction + additionalCommissionReduction,
    finalCommissionRate,
    isValid,
    errorMessage
  };
};

export const getMarkupValidationMessage = (
  cost: number,
  sellPrice: number,
  currentCommissionRate: number,
  category?: Category,
  agentCommissionRate: number = 15
): string | null => {
  const calculation = calculateMarkupAndCommission(cost, sellPrice, currentCommissionRate, category, agentCommissionRate);
  
  if (!calculation.isValid) {
    return calculation.errorMessage || "Invalid markup configuration";
  }
  
  if (calculation.commissionReduction > 0) {
    return `Commission reduced by ${calculation.commissionReduction.toFixed(1)}% due to markup below minimum (${calculation.minimumMarkup}%)`;
  }
  
  return null;
};
