import { cn } from "@/lib/utils";
import type { TimeSlot } from "@/lib/types";

interface TimeSlotGridProps {
  slots: TimeSlot[];
  selectedTime: string | null;
  onTimeSelect: (time: string) => void;
}

export default function TimeSlotGrid({
  slots,
  selectedTime,
  onTimeSelect,
}: TimeSlotGridProps) {
  return (
    <div>
      <p className="mb-3 text-[13px] font-medium text-text-secondary">
        Elegí un horario
      </p>
      <div className="grid grid-cols-3 gap-2">
        {slots.map((slot) => {
          const isSelected = slot.time === selectedTime;

          return (
            <button
              key={slot.time}
              type="button"
              disabled={!slot.available}
              onClick={() => onTimeSelect(slot.time)}
              className={cn(
                "rounded-lg py-2.5 text-center text-sm font-medium transition-colors",
                isSelected
                  ? "bg-primary text-white"
                  : slot.available
                    ? "border border-border bg-surface text-text-primary hover:border-primary hover:text-primary"
                    : "cursor-not-allowed bg-surface text-border line-through"
              )}
            >
              {slot.time}
            </button>
          );
        })}
      </div>
    </div>
  );
}
