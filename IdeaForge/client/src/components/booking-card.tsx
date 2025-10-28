import { format } from "date-fns";
import { Calendar, Clock, MapPin, User, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ReservationWithDetails } from "@shared/schema";

interface BookingCardProps {
  reservation: ReservationWithDetails;
  onCheckIn?: (id: string) => void;
  onCancel?: (id: string) => void;
  showActions?: boolean;
}

export function BookingCard({ 
  reservation, 
  onCheckIn, 
  onCancel,
  showActions = true 
}: BookingCardProps) {
  const getStatusBadge = () => {
    switch (reservation.status) {
      case "confirmed":
        return (
          <Badge variant="default" data-testid={`badge-status-${reservation.id}`}>
            <AlertCircle className="h-3 w-3 mr-1" />
            Awaiting Check-in
          </Badge>
        );
      case "checked_in":
        return (
          <Badge variant="default" data-testid={`badge-status-${reservation.id}`}>
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Checked In
          </Badge>
        );
      case "cancelled":
        return (
          <Badge variant="secondary" data-testid={`badge-status-${reservation.id}`}>
            <XCircle className="h-3 w-3 mr-1" />
            Cancelled
          </Badge>
        );
      case "no_show":
        return (
          <Badge variant="destructive" data-testid={`badge-status-${reservation.id}`}>
            <XCircle className="h-3 w-3 mr-1" />
            No Show
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" data-testid={`badge-status-${reservation.id}`}>
            Pending
          </Badge>
        );
    }
  };

  // Check-in is available from 15 minutes before start time until the check-in deadline
  const now = new Date();
  const startDateTime = new Date(`${reservation.date}T${reservation.startTime}`);
  const checkInOpenTime = new Date(startDateTime.getTime() - 15 * 60 * 1000); // 15 min before
  
  // If deadline is null, calculate it as 15 minutes after start time
  const deadline = reservation.checkInDeadline 
    ? new Date(reservation.checkInDeadline)
    : new Date(startDateTime.getTime() + 15 * 60 * 1000);
  
  const isCheckInWindowOpen = now >= checkInOpenTime && now <= deadline;
  const canCheckIn = reservation.status === "confirmed" && isCheckInWindowOpen;
  const isUpcoming = startDateTime > now;

  return (
    <Card className="p-4" data-testid={`card-booking-${reservation.id}`}>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        {/* Left Side - Booking Details */}
        <div className="space-y-3 flex-1">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold" data-testid={`text-room-${reservation.id}`}>
                {reservation.room.name}
              </h3>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                <MapPin className="h-3.5 w-3.5" />
                <span>{reservation.room.building}, Floor {reservation.room.floor}</span>
              </div>
            </div>
            <div className="sm:hidden">
              {getStatusBadge()}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium" data-testid={`text-date-${reservation.id}`}>
                {format(new Date(reservation.date), "MMM dd, yyyy")}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium" data-testid={`text-time-${reservation.id}`}>
                {reservation.startTime} - {reservation.endTime}
              </span>
            </div>
          </div>

          {reservation.purpose && (
            <p className="text-sm text-muted-foreground">
              <span className="font-medium">Purpose:</span> {reservation.purpose}
            </p>
          )}
        </div>

        {/* Right Side - Status & Actions */}
        <div className="flex flex-col items-start sm:items-end gap-3">
          <div className="hidden sm:block">
            {getStatusBadge()}
          </div>
          
          {showActions && (isUpcoming || canCheckIn) && (
            <div className="flex gap-2 w-full sm:w-auto">
              {canCheckIn && onCheckIn && (
                <Button
                  size="sm"
                  onClick={() => onCheckIn(reservation.id)}
                  data-testid={`button-checkin-${reservation.id}`}
                >
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  Check In
                </Button>
              )}
              {(reservation.status === "pending" || reservation.status === "confirmed") && onCancel && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onCancel(reservation.id)}
                  data-testid={`button-cancel-${reservation.id}`}
                >
                  Cancel
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
