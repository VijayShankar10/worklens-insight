import { Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";

interface DateRangePickerProps {
  startDate: Date;
  endDate: Date;
  onStartDateChange: (date: Date) => void;
  onEndDateChange: (date: Date) => void;
}

const DateRangePicker = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
}: DateRangePickerProps) => {
  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      {/* Start Date Picker */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Start Date</label>
        <Popover>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              className="w-full sm:w-[240px] justify-start text-left font-normal"
            >
              <Calendar className="mr-2 h-4 w-4" />
              {format(startDate, "PPP")}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <CalendarComponent
              mode="single"
              selected={startDate}
              onSelect={(date) => date && onStartDateChange(date)}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* End Date Picker */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">End Date</label>
        <Popover>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              className="w-full sm:w-[240px] justify-start text-left font-normal"
            >
              <Calendar className="mr-2 h-4 w-4" />
              {format(endDate, "PPP")}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <CalendarComponent
              mode="single"
              selected={endDate}
              onSelect={(date) => date && onEndDateChange(date)}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};

export default DateRangePicker;
