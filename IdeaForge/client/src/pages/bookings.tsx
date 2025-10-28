import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Calendar, Clock } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { BookingCard } from "@/components/booking-card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { ReservationWithDetails } from "@shared/schema";

export default function Bookings() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("upcoming");

  // Fetch user reservations
  const { data: reservations, isLoading } = useQuery<ReservationWithDetails[]>({
    queryKey: ["/api/reservations/my"],
  });

  // Check-in mutation
  const checkInMutation = useMutation({
    mutationFn: async (reservationId: string) => {
      return apiRequest("POST", `/api/reservations/${reservationId}/checkin`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reservations/my"] });
      queryClient.invalidateQueries({ queryKey: ["/api/rooms"] });
      toast({
        title: "Checked In Successfully!",
        description: "Enjoy your reserved space.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Check-in Failed",
        description: error.message || "Unable to check in. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Cancel mutation
  const cancelMutation = useMutation({
    mutationFn: async (reservationId: string) => {
      return apiRequest("DELETE", `/api/reservations/${reservationId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reservations/my"] });
      queryClient.invalidateQueries({ queryKey: ["/api/rooms"] });
      toast({
        title: "Reservation Cancelled",
        description: "Your reservation has been cancelled successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Cancellation Failed",
        description: error.message || "Unable to cancel reservation. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCheckIn = (reservationId: string) => {
    checkInMutation.mutate(reservationId);
  };

  const handleCancel = (reservationId: string) => {
    if (confirm("Are you sure you want to cancel this reservation?")) {
      cancelMutation.mutate(reservationId);
    }
  };

  // Filter reservations
  const now = new Date();
  const upcomingReservations = reservations?.filter((r) => {
    const reservationDateTime = new Date(`${r.date}T${r.startTime}`);
    return reservationDateTime >= now && r.status !== "cancelled" && r.status !== "no_show";
  }) || [];

  const pastReservations = reservations?.filter((r) => {
    const reservationDateTime = new Date(`${r.date}T${r.startTime}`);
    return reservationDateTime < now || r.status === "cancelled" || r.status === "no_show";
  }) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold leading-tight" data-testid="text-page-title">
          My Bookings
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage your classroom reservations
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="upcoming" data-testid="tab-upcoming">
            <Calendar className="h-4 w-4 mr-2" />
            Upcoming ({upcomingReservations.length})
          </TabsTrigger>
          <TabsTrigger value="past" data-testid="tab-past">
            <Clock className="h-4 w-4 mr-2" />
            Past ({pastReservations.length})
          </TabsTrigger>
        </TabsList>

        {/* Upcoming Tab */}
        <TabsContent value="upcoming" className="space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : upcomingReservations.length > 0 ? (
            <div className="space-y-4">
              {upcomingReservations.map((reservation) => (
                <BookingCard
                  key={reservation.id}
                  reservation={reservation}
                  onCheckIn={handleCheckIn}
                  onCancel={handleCancel}
                  showActions={true}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-card border rounded-lg">
              <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No Upcoming Bookings</h3>
              <p className="text-muted-foreground mb-4">
                You don't have any upcoming reservations
              </p>
              <Button onClick={() => window.location.href = "/dashboard"} data-testid="button-browse-rooms">
                Browse Available Rooms
              </Button>
            </div>
          )}
        </TabsContent>

        {/* Past Tab */}
        <TabsContent value="past" className="space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : pastReservations.length > 0 ? (
            <div className="space-y-4">
              {pastReservations.map((reservation) => (
                <BookingCard
                  key={reservation.id}
                  reservation={reservation}
                  showActions={false}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-card border rounded-lg">
              <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No Past Bookings</h3>
              <p className="text-muted-foreground">
                Your booking history will appear here
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
