import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TimeSlotPickerProps {
  selectedDate: string;
  selectedStartTime: string | null;
  selectedEndTime: string | null;
  onTimeSelect: (startTime: string, endTime: string) => void;
  bookedSlots?: string[]; // Array of start times that are booked
}

export function TimeSlotPicker({
  selectedDate,
  selectedStartTime,
  selectedEndTime,
  onTimeSelect,
  bookedSlots = [],
}: TimeSlotPickerProps) {
  const [duration, setDuration] = useState<30 | 60 | 90 | 120>(60);

  // Generate time slots from 7:00 AM to 9:00 PM in 30-minute increments
  const generateTimeSlots = () => {
    const slots: string[] = [];
    for (let hour = 7; hour < 21; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
        slots.push(time);
      }
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  const calculateEndTime = (startTime: string, durationMinutes: number): string => {
    const [hours, minutes] = startTime.split(":").map(Number);
    const totalMinutes = hours * 60 + minutes + durationMinutes;
    const endHours = Math.floor(totalMinutes / 60);
    const endMinutes = totalMinutes % 60;
    return `${endHours.toString().padStart(2, "0")}:${endMinutes.toString().padStart(2, "0")}`;
  };

  const isSlotDisabled = (time: string): boolean => {
    // Check if slot is in the past (only for today)
    const now = new Date();
    const today = now.toISOString().split("T")[0];
    
    if (selectedDate === today) {
      const [hours, minutes] = time.split(":").map(Number);
      const slotTime = new Date(now);
      slotTime.setHours(hours, minutes, 0, 0);
      
      // Require 30 minutes advance booking
      const minBookingTime = new Date(now.getTime() + 30 * 60 * 1000);
      if (slotTime < minBookingTime) {
        return true;
      }
    }

    // Check if slot is booked
    return bookedSlots.includes(time);
  };

  const handleSlotClick = (time: string) => {
    if (isSlotDisabled(time)) return;
    const endTime = calculateEndTime(time, duration);
    onTimeSelect(time, endTime);
  };

  return (
    <div className="space-y-4">
      {/* Duration Selector */}
      <div>
        <label className="text-sm font-medium mb-2 block">Duration</label>
        <div className="grid grid-cols-4 gap-2">
          {[30, 60, 90, 120].map((mins) => (
            <Button
              key={mins}
              type="button"
              variant={duration === mins ? "default" : "outline"}
              size="sm"
              onClick={() => setDuration(mins as 30 | 60 | 90 | 120)}
              data-testid={`button-duration-${mins}`}
            >
              {mins} min
            </Button>
          ))}
        </div>
      </div>

      {/* Time Slots Grid */}
      <div>
        <label className="text-sm font-medium mb-2 block">Select Start Time</label>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-80 overflow-y-auto p-1">
          {timeSlots.map((time) => {
            const disabled = isSlotDisabled(time);
            const selected = time === selectedStartTime;
            
            return (
              <Button
                key={time}
                type="button"
                variant={selected ? "default" : "outline"}
                size="sm"
                disabled={disabled}
                onClick={() => handleSlotClick(time)}
                className={cn(
                  "h-auto py-3",
                  disabled && "opacity-40 cursor-not-allowed"
                )}
                data-testid={`button-timeslot-${time.replace(":", "-")}`}
              >
                {time}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Selected Time Display */}
      {selectedStartTime && selectedEndTime && (
        <div className="p-3 bg-primary/10 rounded-md border border-primary/20">
          <p className="text-sm font-medium">
            Selected: {selectedStartTime} - {selectedEndTime}
          </p>
        </div>
      )}
    </div>
  );
}
