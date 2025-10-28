import { useQuery } from "@tanstack/react-query";
import { BarChart3, Users, Calendar, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import type { ReservationWithDetails } from "@shared/schema";

export default function Admin() {
  // Fetch all reservations
  const { data: reservations, isLoading } = useQuery<ReservationWithDetails[]>({
    queryKey: ["/api/admin/reservations"],
  });

  // Calculate statistics
  const totalReservations = reservations?.length || 0;
  const activeReservations = reservations?.filter(
    (r) => r.status === "confirmed" || r.status === "checked_in"
  ).length || 0;
  const completedReservations = reservations?.filter(
    (r) => r.status === "checked_in"
  ).length || 0;
  const noShowCount = reservations?.filter(
    (r) => r.status === "no_show"
  ).length || 0;

  const utilizationRate = totalReservations > 0
    ? Math.round((completedReservations / totalReservations) * 100)
    : 0;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge variant="default" className="bg-blue-600">Confirmed</Badge>;
      case "checked_in":
        return <Badge variant="default" className="bg-green-600">Checked In</Badge>;
      case "cancelled":
        return <Badge variant="secondary">Cancelled</Badge>;
      case "no_show":
        return <Badge variant="destructive">No Show</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold leading-tight" data-testid="text-page-title">
          Admin Panel
        </h1>
        <p className="text-muted-foreground mt-1">
          Monitor room reservations and utilization statistics
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Bookings</p>
              <p className="text-2xl font-bold mt-1" data-testid="text-total-bookings">
                {totalReservations}
              </p>
            </div>
            <div className="h-12 w-12 bg-primary/10 rounded-md flex items-center justify-center">
              <Calendar className="h-6 w-6 text-primary" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active Bookings</p>
              <p className="text-2xl font-bold mt-1" data-testid="text-active-bookings">
                {activeReservations}
              </p>
            </div>
            <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/20 rounded-md flex items-center justify-center">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Utilization Rate</p>
              <p className="text-2xl font-bold mt-1" data-testid="text-utilization-rate">
                {utilizationRate}%
              </p>
            </div>
            <div className="h-12 w-12 bg-green-100 dark:bg-green-900/20 rounded-md flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">No-Shows</p>
              <p className="text-2xl font-bold mt-1" data-testid="text-no-shows">
                {noShowCount}
              </p>
            </div>
            <div className="h-12 w-12 bg-destructive/10 rounded-md flex items-center justify-center">
              <BarChart3 className="h-6 w-6 text-destructive" />
            </div>
          </div>
        </Card>
      </div>

      {/* Reservations Table */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">All Reservations</h2>
        
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : reservations && reservations.length > 0 ? (
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Room</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Purpose</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reservations.slice(0, 20).map((reservation) => (
                  <TableRow key={reservation.id}>
                    <TableCell className="font-medium">
                      {reservation.room.name}
                      <div className="text-xs text-muted-foreground">
                        Floor {reservation.room.floor}
                      </div>
                    </TableCell>
                    <TableCell>
                      {reservation.user.name}
                      <div className="text-xs text-muted-foreground">
                        {reservation.user.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      {format(new Date(reservation.date), "MMM dd, yyyy")}
                    </TableCell>
                    <TableCell>
                      {reservation.startTime} - {reservation.endTime}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(reservation.status)}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {reservation.purpose || "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No reservations found
          </div>
        )}
      </Card>
    </div>
  );
}
