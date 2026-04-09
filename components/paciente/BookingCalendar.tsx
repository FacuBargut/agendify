"use client";

import { useState } from "react";
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  format,
  isSameDay,
  isBefore,
  startOfDay,
  addMonths,
  subMonths,
  isToday,
} from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TimeSlot } from "@/lib/types";

const WEEK_HEADERS = ["L", "M", "X", "J", "V", "S", "D"];

interface BookingCalendarProps {
  availableSlots: Record<string, TimeSlot[]>;
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
}

export default function BookingCalendar({
  availableSlots,
  selectedDate,
  onDateSelect,
}: BookingCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(new Date()));

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Monday-based offset: getDay returns 0=Sun, we want Mon=0
  const firstDayOffset = (getDay(monthStart) + 6) % 7;

  function hasAvailableSlots(day: Date): boolean {
    const key = format(day, "yyyy-MM-dd");
    const slots = availableSlots[key];
    return !!slots && slots.some((s) => s.available);
  }

  function isPast(day: Date): boolean {
    return isBefore(day, startOfDay(new Date()));
  }

  return (
    <div>
      {/* Month header */}
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
          className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-surface"
        >
          <ChevronLeft size={18} className="text-text-secondary" />
        </button>
        <span className="text-base font-medium capitalize text-text-primary">
          {format(currentMonth, "MMMM yyyy", { locale: es })}
        </span>
        <button
          type="button"
          onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
          className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-surface"
        >
          <ChevronRight size={18} className="text-text-secondary" />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="mb-2 grid grid-cols-7 gap-0">
        {WEEK_HEADERS.map((d) => (
          <div
            key={d}
            className="text-center text-[11px] font-medium text-text-secondary"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-0">
        {/* Empty cells for offset */}
        {Array.from({ length: firstDayOffset }).map((_, i) => (
          <div key={`empty-${i}`} className="h-10" />
        ))}

        {daysInMonth.map((day) => {
          const past = isPast(day);
          const available = hasAvailableSlots(day) && !past;
          const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
          const today = isToday(day);

          return (
            <button
              key={day.toISOString()}
              type="button"
              disabled={!available}
              onClick={() => onDateSelect(day)}
              className={cn(
                "mx-auto flex h-9 w-9 items-center justify-center rounded-full text-sm transition-colors",
                isSelected
                  ? "bg-primary font-medium text-white"
                  : today && available
                    ? "border border-primary font-medium text-primary"
                    : available
                      ? "font-medium text-text-primary hover:bg-primary-light"
                      : "cursor-default text-border"
              )}
            >
              {format(day, "d")}
            </button>
          );
        })}
      </div>
    </div>
  );
}
