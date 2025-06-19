
// Main PDF utilities with multiple generation options
export { generateQuotePDF } from './pdf/index';
export { generateQuotePDFWithReactPdf, downloadQuotePDF } from './pdf/reactPdfGenerator';

// Re-export for backward compatibility
export { generateQuotePDF as generateQuotePDFLegacy } from './pdf/index';
