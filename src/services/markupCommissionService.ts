
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
  agentCommissionRate: number,
  category?: Category
): MarkupCommissionCalculation => {
  const minimumMarkup = category?.minimum_markup || 0;
  const currentMarkup = cost > 0 ? ((sellPrice - cost) / cost) * 100 : 0;
  
  // Calculate how much the agent can reduce the markup (limited by their commission rate)
  const maxMarkupReduction = Math.min(minimumMarkup, agentCommissionRate);
  
  // Calculate commission reduction based on markup reduction below minimum
  const markupReduction = Math.max(0, minimumMarkup - currentMarkup);
  const commissionReduction = Math.min(markupReduction, agentCommissionRate);
  
  // Final commission rate after reduction
  const finalCommissionRate = Math.max(0, agentCommissionRate - commissionReduction);
  
  // Validate if the current markup is acceptable
  const isValid = currentMarkup >= 0 && commissionReduction <= agentCommissionRate;
  
  let errorMessage: string | undefined;
  if (currentMarkup < 0) {
    errorMessage = "Sell price cannot be below cost";
  } else if (commissionReduction > agentCommissionRate) {
    errorMessage = `Reducing markup below ${minimumMarkup}% would require more commission reduction than available (${agentCommissionRate}%)`;
  }

  return {
    minimumMarkup,
    currentMarkup,
    maxMarkupReduction,
    commissionReduction,
    finalCommissionRate,
    isValid,
    errorMessage
  };
};

export const getMarkupValidationMessage = (
  cost: number,
  sellPrice: number,
  agentCommissionRate: number,
  category?: Category
): string | null => {
  const calculation = calculateMarkupAndCommission(cost, sellPrice, agentCommissionRate, category);
  
  if (!calculation.isValid) {
    return calculation.errorMessage || "Invalid markup configuration";
  }
  
  if (calculation.commissionReduction > 0) {
    return `Commission reduced by ${calculation.commissionReduction.toFixed(1)}% due to markup below minimum (${calculation.minimumMarkup}%)`;
  }
  
  return null;
};
