
import { TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const QuoteTableHeader = () => {
  return (
    <TableHeader>
      <TableRow>
        <TableHead>Salesperson</TableHead>
        <TableHead>Quote #</TableHead>
        <TableHead>Company</TableHead>
        <TableHead>Description</TableHead>
        <TableHead className="text-right">NRC Total</TableHead>
        <TableHead className="text-right">MRC Total</TableHead>
        <TableHead>Status</TableHead>
        <TableHead>Acceptance</TableHead>
        <TableHead className="text-center">Actions</TableHead>
      </TableRow>
    </TableHeader>
  );
};
