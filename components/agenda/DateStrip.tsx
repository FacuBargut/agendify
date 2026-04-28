"use client";

import { useEffect, useRef, useState } from "react";
import { addDays, isSameDay, isToday } from "date-fns";
import { cn } from "@/lib/utils";

const DAY_LETTERS = ["D", "L", "M", "X", "J", "V", "S"];

function buildDays(): Date[] {
  const today = new Date();
  const start = addDays(today, -3);
  return Array.from({ length: 14 }, (_, i) => addDays(start, i));
}

interface DateStripProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export default function DateStrip({ selectedDate, onDateChange }: DateStripProps) {
  const [days] = useState(buildDays);
  const scrollRef = useRef<HTMLDivElement>(null);
  const todayRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    todayRef.current?.scrollIntoView({
      inline: "center",
      block: "nearest",
    });
  }, []);

  return (
    <div
      ref={scrollRef}
      className="sticky top-16 z-30 flex gap-2 overflow-x-auto border-b border-border bg-background px-4 py-3 scrollbar-hide"
    >
      {days.map((day) => {
        const isSelected = isSameDay(day, selectedDate);
        const isTodayDate = isToday(day);
        const dayNum = day.getDate().toString();
        const dayLetter = DAY_LETTERS[day.getDay()];

        return (
          <button
            key={day.toISOString()}
            ref={isTodayDate ? todayRef : undefined}
            type="button"
            onClick={() => onDateChange(day)}
            className={cn(
              "flex h-16 w-11 shrink-0 flex-col items-center justify-center rounded-lg transition-colors",
              isSelected
                ? "bg-primary text-white"
                : isTodayDate
                  ? "border border-primary text-primary"
                  : "text-text-secondary"
            )}
          >
            <span className="text-[11px] font-medium leading-none">
              {dayLetter}
            </span>
            <span className="mt-1 text-[15px] font-medium leading-none">
              {dayNum}
            </span>
          </button>
        );
      })}
    </div>
  );
}
