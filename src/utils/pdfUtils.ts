// Updated to use React PDF renderer as the primary method
export { generateQuotePDFWithReactPdf as generateQuotePDF, downloadQuotePDF } from './pdf/reactPdfGenerator';

// Keep legacy method available if needed
export { generateQuotePDF as generateQuotePDFLegacy } from './pdf/index';
