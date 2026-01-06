import * as React from "react"
import { DayPicker } from "react-day-picker"
import "react-day-picker/style.css"

import { cn } from "../../lib/utils"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        today: `border-2 border-primary/50 rounded-full`,
        selected: `bg-primary text-primary-foreground rounded-full`,
        range_start: `bg-primary text-white rounded-full`,
        range_end: `bg-primary text-white rounded-full`,
        range_middle: `!bg-sky-100 dark:!bg-sky-900/20 !text-foreground !rounded-none`,
        chevron: `fill-primary`,
        ...classNames,
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
