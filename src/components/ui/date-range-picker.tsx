import * as React from "react";
import { format, startOfDay, endOfDay, subMinutes, subHours, subDays, startOfMonth, endOfMonth } from "date-fns";
import { Calendar } from "./calendar";
import { Button } from "./button";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";
import { Input } from "./input";
import { Label } from "./label";
import { CalendarIcon } from "lucide-react";
import { cn } from "../../lib/utils";

interface DateRangePickerProps {
  dateFrom: string; // Format: "YYYY-MM-DD HH:mm:ss"
  dateTo: string; // Format: "YYYY-MM-DD HH:mm:ss"
  onChange: (from: string, to: string) => void;
  className?: string;
}

const PREDEFINED_RANGES = [
  { label: "Last 30 Mins", getValue: () => {
    const to = new Date();
    const from = subMinutes(to, 30);
    return { from, to };
  }},
  { label: "Last 1 Hour", getValue: () => {
    const to = new Date();
    const from = subHours(to, 1);
    return { from, to };
  }},
  { label: "Last 6 Hours", getValue: () => {
    const to = new Date();
    const from = subHours(to, 6);
    return { from, to };
  }},
  { label: "Last 24 Hours", getValue: () => {
    const to = new Date();
    const from = subHours(to, 24);
    return { from, to };
  }},
  { label: "Today", getValue: () => {
    const now = new Date();
    return { from: startOfDay(now), to: endOfDay(now) };
  }},
  { label: "Yesterday", getValue: () => {
    const yesterday = subDays(new Date(), 1);
    return { from: startOfDay(yesterday), to: endOfDay(yesterday) };
  }},
  { label: "Last 7 Days", getValue: () => {
    const to = endOfDay(new Date());
    const from = startOfDay(subDays(to, 6));
    return { from, to };
  }},
  { label: "Last 30 Days", getValue: () => {
    const to = endOfDay(new Date());
    const from = startOfDay(subDays(to, 29));
    return { from, to };
  }},
  { label: "This Month", getValue: () => {
    const now = new Date();
    return { from: startOfMonth(now), to: endOfMonth(now) };
  }},
  { label: "Last Month", getValue: () => {
    const lastMonth = subDays(startOfMonth(new Date()), 1);
    return { from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) };
  }},
];

export function DateRangePicker({
  dateFrom,
  dateTo,
  onChange,
  className,
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<"date" | "time">("date");

  // Parse dates
  const fromDate = React.useMemo(() => {
    try {
      const [datePart, timePart] = dateFrom.split(" ");
      const [year, month, day] = datePart.split("-").map(Number);
      const [hours = 0, minutes = 0, seconds = 0] = (timePart || "00:00:00").split(":").map(Number);
      return new Date(year, month - 1, day, hours, minutes, seconds);
    } catch {
      return startOfDay(new Date());
    }
  }, [dateFrom]);

  const toDate = React.useMemo(() => {
    try {
      const [datePart, timePart] = dateTo.split(" ");
      const [year, month, day] = datePart.split("-").map(Number);
      const [hours = 23, minutes = 59, seconds = 59] = (timePart || "23:59:59").split(":").map(Number);
      return new Date(year, month - 1, day, hours, minutes, seconds);
    } catch {
      return endOfDay(new Date());
    }
  }, [dateTo]);

  // Local state for calendar selection
  const [selectedRange, setSelectedRange] = React.useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: fromDate,
    to: toDate,
  });

  // Local state for time selection
  const [fromTime, setFromTime] = React.useState({
    hours: fromDate.getHours().toString().padStart(2, "0"),
    minutes: fromDate.getMinutes().toString().padStart(2, "0"),
  });

  const [toTime, setToTime] = React.useState({
    hours: toDate.getHours().toString().padStart(2, "0"),
    minutes: toDate.getMinutes().toString().padStart(2, "0"),
  });

  // Update local state when props change
  React.useEffect(() => {
    setSelectedRange({ from: fromDate, to: toDate });
    setFromTime({
      hours: fromDate.getHours().toString().padStart(2, "0"),
      minutes: fromDate.getMinutes().toString().padStart(2, "0"),
    });
    setToTime({
      hours: toDate.getHours().toString().padStart(2, "0"),
      minutes: toDate.getMinutes().toString().padStart(2, "0"),
    });
  }, [fromDate, toDate]);

  const handlePredefinedRange = (range: typeof PREDEFINED_RANGES[0]) => {
    const rangeValue = range.getValue();
    if (!rangeValue || !rangeValue.from || !rangeValue.to) {
      return;
    }
    const { from, to } = rangeValue;
    const fromStr = format(from, "yyyy-MM-dd HH:mm:ss");
    const toStr = format(to, "yyyy-MM-dd HH:mm:ss");
    onChange(fromStr, toStr);
    setSelectedRange({ from, to });
    setFromTime({
      hours: from.getHours().toString().padStart(2, "0"),
      minutes: from.getMinutes().toString().padStart(2, "0"),
    });
    setToTime({
      hours: to.getHours().toString().padStart(2, "0"),
      minutes: to.getMinutes().toString().padStart(2, "0"),
    });
  };

  const handleDateSelect = (range: { from: Date | undefined; to: Date | undefined } | undefined) => {
    if (!range) {
      // If range is undefined, keep current selection
      return;
    }
    setSelectedRange({
      from: range.from ?? selectedRange.from,
      to: range.to ?? selectedRange.to,
    });
  };

  const handleApply = () => {
    if (!selectedRange.from || !selectedRange.to) return;

    // Combine date with time
    const from = new Date(selectedRange.from);
    from.setHours(parseInt(fromTime.hours) || 0, parseInt(fromTime.minutes) || 0, 0);

    const to = new Date(selectedRange.to);
    to.setHours(parseInt(toTime.hours) || 23, parseInt(toTime.minutes) || 59, 59);

    const fromStr = format(from, "yyyy-MM-dd HH:mm:ss");
    const toStr = format(to, "yyyy-MM-dd HH:mm:ss");
    onChange(fromStr, toStr);
    setOpen(false);
  };

  const handleCancel = () => {
    // Reset to original values
    setSelectedRange({ from: fromDate, to: toDate });
    setFromTime({
      hours: fromDate.getHours().toString().padStart(2, "0"),
      minutes: fromDate.getMinutes().toString().padStart(2, "0"),
    });
    setToTime({
      hours: toDate.getHours().toString().padStart(2, "0"),
      minutes: toDate.getMinutes().toString().padStart(2, "0"),
    });
    setOpen(false);
  };

  const displayText = React.useMemo(() => {
    const fromStr = format(fromDate, "MMM dd, yyyy HH:mm");
    const toStr = format(toDate, "MMM dd, yyyy HH:mm");
    return `${fromStr} → ${toStr}`;
  }, [fromDate, toDate]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal h-9",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {displayText}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex">
          {/* Predefined Ranges Sidebar */}
          <div className="border-r p-2 w-40">
            <div className="text-xs font-semibold mb-2 px-2">Quick Select</div>
            <div className="space-y-1">
              {PREDEFINED_RANGES.map((range) => (
                <Button
                  key={range.label}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-xs h-8"
                  onClick={() => handlePredefinedRange(range)}
                >
                  {range.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div className="p-4">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "date" | "time")}>
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="date">Date Selection</TabsTrigger>
                <TabsTrigger value="time">Time Selection</TabsTrigger>
              </TabsList>

              <TabsContent value="date" className="space-y-4">
                <Calendar
                  mode="range"
                  selected={{
                    from: selectedRange.from,
                    to: selectedRange.to,
                  }}
                  onSelect={handleDateSelect}
                  numberOfMonths={1}
                />
              </TabsContent>

              <TabsContent value="time" className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <Label className="text-xs mb-2 block">From Time</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="0"
                        max="23"
                        value={fromTime.hours}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === "" || (parseInt(val) >= 0 && parseInt(val) <= 23)) {
                            setFromTime({ ...fromTime, hours: val.padStart(2, "0") });
                          }
                        }}
                        className="w-16 h-9"
                        placeholder="HH"
                      />
                      <span>:</span>
                      <Input
                        type="number"
                        min="0"
                        max="59"
                        value={fromTime.minutes}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === "" || (parseInt(val) >= 0 && parseInt(val) <= 59)) {
                            setFromTime({ ...fromTime, minutes: val.padStart(2, "0") });
                          }
                        }}
                        className="w-16 h-9"
                        placeholder="MM"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs mb-2 block">To Time</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="0"
                        max="23"
                        value={toTime.hours}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === "" || (parseInt(val) >= 0 && parseInt(val) <= 23)) {
                            setToTime({ ...toTime, hours: val.padStart(2, "0") });
                          }
                        }}
                        className="w-16 h-9"
                        placeholder="HH"
                      />
                      <span>:</span>
                      <Input
                        type="number"
                        min="0"
                        max="59"
                        value={toTime.minutes}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === "" || (parseInt(val) >= 0 && parseInt(val) <= 59)) {
                            setToTime({ ...toTime, minutes: val.padStart(2, "0") });
                          }
                        }}
                        className="w-16 h-9"
                        placeholder="MM"
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
              <Button variant="outline" size="sm" onClick={handleCancel}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleApply}>
                Apply
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

