import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { ChevronLeft, MapPin, Users, Wifi, Projector, AirVent } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { TimeSlotPicker } from "@/components/time-slot-picker";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Room, InsertReservation, Reservation } from "@shared/schema";

export default function RoomDetails() {
  const [, params] = useRoute("/room/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedStartTime, setSelectedStartTime] = useState<string | null>(null);
  const [selectedEndTime, setSelectedEndTime] = useState<string | null>(null);
  const [purpose, setPurpose] = useState("");

  const roomId = params?.id;

  // Fetch room details
  const { data: room, isLoading } = useQuery<Room>({
    queryKey: ["/api/rooms", roomId],
    enabled: !!roomId,
  });

  // Fetch room reservations for the selected date
  const { data: roomReservations, error: reservationsError } = useQuery<Reservation[]>({
    queryKey: ["/api/rooms", roomId, "reservations", format(selectedDate, "yyyy-MM-dd")],
    enabled: !!roomId,
    queryFn: async () => {
      const response = await fetch(`/api/rooms/${roomId}/reservations?date=${format(selectedDate, "yyyy-MM-dd")}`);
      if (!response.ok) throw new Error('Failed to fetch reservations');
      return response.json();
    },
    retry: false,
  });

  // Create reservation mutation
  const createReservation = useMutation({
    mutationFn: async (data: InsertReservation) => {
      return apiRequest("POST", "/api/reservations", data);
    },
    onSuccess: () => {
      // Invalidate all room queries to refresh availability
      queryClient.invalidateQueries({ queryKey: ["/api/rooms"] });
      if (roomId) {
        queryClient.invalidateQueries({ queryKey: ["/api/rooms", roomId] });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/reservations/my"] });
      toast({
        title: "Reservation Created!",
        description: "Your classroom has been reserved successfully.",
      });
      setLocation("/bookings");
    },
    onError: (error: any) => {
      toast({
        title: "Reservation Failed",
        description: error.message || "Unable to create reservation. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Calculate booked time slots
  const bookedSlots = roomReservations
    ?.filter(reservation => 
      reservation.status === "confirmed" || reservation.status === "checked_in"
    )
    .map(reservation => reservation.startTime) || [];

  const handleReservation = () => {
    if (!roomId || !selectedStartTime || !selectedEndTime) {
      toast({
        title: "Missing Information",
        description: "Please select a date and time slot.",
        variant: "destructive",
      });
      return;
    }

    // Check if the selected time slot is already booked
    if (bookedSlots.includes(selectedStartTime)) {
      toast({
        title: "Time Slot Unavailable",
        description: "This time slot has been booked by someone else. Please select a different time.",
        variant: "destructive",
      });
      return;
    }

    const reservationData: Omit<InsertReservation, "userId"> = {
      roomId,
      date: format(selectedDate, "yyyy-MM-dd"),
      startTime: selectedStartTime,
      endTime: selectedEndTime,
      purpose: purpose || undefined,
    };

    console.log('Creating reservation:', reservationData);
    createReservation.mutate(reservationData as InsertReservation);
  };

  const amenityIcons: Record<string, any> = {
    "WiFi": Wifi,
    "Projector": Projector,
    "Air Conditioning": AirVent,
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold mb-2">Room Not Found</h2>
        <p className="text-muted-foreground mb-4">The room you're looking for doesn't exist.</p>
        <Button onClick={() => setLocation("/dashboard")} data-testid="button-back-dashboard">
          Back to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Button
        variant="ghost"
        className="pl-0"
        onClick={() => setLocation("/dashboard")}
        data-testid="button-back"
      >
        <ChevronLeft className="h-4 w-4 mr-1" />
        Back to Rooms
      </Button>

      {/* Room Header */}
      <div>
        <h1 className="text-3xl font-semibold leading-tight" data-testid="text-room-name">
          {room.name}
        </h1>
        <div className="flex items-center gap-2 text-muted-foreground mt-2">
          <MapPin className="h-4 w-4" />
          <span>{room.building}, Floor {room.floor}</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Room Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Room Info Card */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Room Information</h2>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-primary/10 rounded-md flex items-center justify-center">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Capacity</p>
                  <p className="font-semibold">{room.capacity} people</p>
                </div>
              </div>

              {/* Amenities */}
              {room.amenities && room.amenities.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-3">Amenities</p>
                  <div className="grid grid-cols-2 gap-3">
                    {room.amenities.map((amenity, index) => {
                      const Icon = amenityIcons[amenity] || Wifi;
                      return (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <span>{amenity}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Date Selection */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Select Date</h2>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
              className="rounded-md border"
            />
          </Card>
        </div>

        {/* Right Column - Booking Form */}
        <div className="lg:sticky lg:top-6 lg:self-start">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Make a Reservation</h2>
            
            <div className="space-y-6">
              {/* Selected Date Display */}
              <div>
                <Label className="text-sm font-medium">Selected Date</Label>
                <p className="text-base font-semibold mt-1">
                  {format(selectedDate, "MMMM dd, yyyy")}
                </p>
              </div>

              {/* Time Slot Picker */}
              <TimeSlotPicker
                selectedDate={format(selectedDate, "yyyy-MM-dd")}
                selectedStartTime={selectedStartTime}
                selectedEndTime={selectedEndTime}
                onTimeSelect={(start, end) => {
                  setSelectedStartTime(start);
                  setSelectedEndTime(end);
                }}
                bookedSlots={bookedSlots}
              />

              {/* Purpose */}
              <div className="space-y-2">
                <Label htmlFor="purpose">Purpose (Optional)</Label>
                <Textarea
                  id="purpose"
                  placeholder="e.g., Group study, Project meeting, Review session..."
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="resize-none"
                  rows={3}
                  data-testid="input-purpose"
                />
              </div>

              {/* Reserve Button */}
              <Button
                className="w-full"
                size="lg"
                disabled={!selectedStartTime || !selectedEndTime || createReservation.isPending}
                onClick={handleReservation}
                data-testid="button-reserve"
              >
                {createReservation.isPending ? "Creating Reservation..." : "Reserve Room"}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                You'll have 15 minutes after the start time to check in, or your reservation will be cancelled.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
