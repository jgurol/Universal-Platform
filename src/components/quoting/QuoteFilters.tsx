
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";

interface QuoteFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
  clientFilter: string;
  onClientFilterChange: (value: string) => void;
  onClearFilters: () => void;
}

export const QuoteFilters = ({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  dateRange,
  onDateRangeChange,
  clientFilter,
  onClientFilterChange,
  onClearFilters
}: QuoteFiltersProps) => {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const hasActiveFilters = searchTerm || statusFilter !== 'all' || dateRange || clientFilter !== 'all';

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Search quotes..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="sent">Sent</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>

          <select
            value={clientFilter}
            onChange={(e) => onClientFilterChange(e.target.value)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="all">All Clients</option>
            {/* Client options would be populated here */}
          </select>

          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[200px] justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    `${format(dateRange.from, "LLL dd")} - ${format(dateRange.to, "LLL dd")}`
                  ) : (
                    format(dateRange.from, "LLL dd, y")
                  )
                ) : (
                  "Pick a date range"
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={onDateRangeChange}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>

          {hasActiveFilters && (
            <Button variant="outline" onClick={onClearFilters} size="sm">
              <X className="w-4 h-4 mr-1" />
              Clear
            </Button>
          )}
        </div>

        {hasActiveFilters && (
          <div className="mt-4 flex flex-wrap gap-2">
            {searchTerm && (
              <Badge variant="secondary">
                Search: {searchTerm}
                <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => onSearchChange('')} />
              </Badge>
            )}
            {statusFilter !== 'all' && (
              <Badge variant="secondary">
                Status: {statusFilter}
                <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => onStatusFilterChange('all')} />
              </Badge>
            )}
            {dateRange && (
              <Badge variant="secondary">
                Date Range
                <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => onDateRangeChange(undefined)} />
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
