// Updated to use PDFShift as the primary method
export { generateQuotePDFWithPDFShift as generateQuotePDF, downloadQuotePDFWithPDFShift as downloadQuotePDF } from './pdf/pdfShiftGenerator';

// Keep React PDF method available as alternative
export { generateQuotePDFWithReactPdf as generateQuotePDFWithReactPdf, downloadQuotePDF as downloadQuotePDFWithReactPdf } from './pdf/reactPdfGenerator';

// Keep legacy method available if needed
export { generateQuotePDF as generateQuotePDFLegacy } from './pdf/index';
