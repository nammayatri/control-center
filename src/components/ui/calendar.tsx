import * as React from "react"
import { DayPicker, getDefaultClassNames } from "react-day-picker"
import "react-day-picker/style.css"

import { cn } from "../../lib/utils"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  const defaultClassNames = getDefaultClassNames();
  
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        ...defaultClassNames,
        today: `border border-primary ${defaultClassNames.today}`,
        selected: `bg-primary text-primary-foreground ${defaultClassNames.selected}`,
        range_start: `bg-primary text-primary-foreground rounded-l-md ${defaultClassNames.range_start}`,
        range_end: `bg-primary text-primary-foreground rounded-r-md ${defaultClassNames.range_end}`,
        range_middle: `bg-accent text-accent-foreground ${defaultClassNames.range_middle}`,
        chevron: `fill-primary ${defaultClassNames.chevron}`,
        ...classNames,
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
