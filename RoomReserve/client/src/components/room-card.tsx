import { Link } from "wouter";
import { Users, MapPin, CheckCircle2, Clock, XCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { RoomWithCurrentStatus } from "@shared/schema";

interface RoomCardProps {
  room: RoomWithCurrentStatus;
}

export function RoomCard({ room }: RoomCardProps) {
  const isAvailable = !room.currentReservation;
  
  return (
    <Card className="overflow-hidden hover-elevate" data-testid={`card-room-${room.id}`}>
      <div className="p-4 space-y-4">
        {/* Room Header */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold" data-testid={`text-room-name-${room.id}`}>
              {room.name}
            </h3>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
              <MapPin className="h-3.5 w-3.5" />
              <span>{room.building}, Floor {room.floor}</span>
            </div>
          </div>
          
          {/* Status Badge */}
          {isAvailable ? (
            <Badge variant="default" data-testid={`badge-status-${room.id}`}>
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Available
            </Badge>
          ) : (
            <Badge variant="destructive" data-testid={`badge-status-${room.id}`}>
              <XCircle className="h-3 w-3 mr-1" />
              Occupied
            </Badge>
          )}
        </div>

        {/* Room Details */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-sm">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-foreground font-medium">{room.capacity}</span>
            <span className="text-muted-foreground">seats</span>
          </div>
        </div>

        {/* Amenities */}
        {room.amenities && room.amenities.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {room.amenities.slice(0, 3).map((amenity, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {amenity}
              </Badge>
            ))}
            {room.amenities.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{room.amenities.length - 3} more
              </Badge>
            )}
          </div>
        )}

        {/* Next Available Time */}
        {room.nextAvailableTime && !isAvailable && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2 border-t">
            <Clock className="h-4 w-4" />
            <span>Available at {room.nextAvailableTime}</span>
          </div>
        )}
        {/* Action Button */}

        <br></br>
        <Link href={`/room/${room.id}`}>
          <Button
            className="w-full content-baseline"
            variant={isAvailable ? "default" : "outline"}
            disabled={!isAvailable}
            data-testid={`button-reserve-${room.id}`}
          >
            {isAvailable ? "Reserve Now" : "View Details"}
          </Button>
        </Link>
      </div>
    </Card>
  );
}
