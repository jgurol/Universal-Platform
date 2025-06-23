
// Re-export all quote service functions from their respective modules
export { createQuoteInDatabase as addQuoteToDatabase } from "./quoteCreationService";
export { updateQuoteInDatabase } from "./quoteUpdateService";
export { deleteQuoteFromDatabase } from "./quoteDeletionService";
export { unarchiveQuoteFromDatabase } from "./quoteUnarchiveService";
export { permanentlyDeleteQuoteFromDatabase } from "./quotePermanentDeletionService";
