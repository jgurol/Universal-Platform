
import jsPDF from 'jspdf';
import { PDFGenerationContext } from '../types';

export const renderContactInfo = (doc: jsPDF, context: PDFGenerationContext, yPos: number, rightColYPos: number): void => {
  // Contact info is now handled directly in billingInfo.ts and serviceAddress.ts
  // This function is kept for backward compatibility but doesn't need to do anything
  // since the contact information is already rendered in the respective address sections
};
