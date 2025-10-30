import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Filter, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RoomCard } from "@/components/room-card";
import { Skeleton } from "@/components/ui/skeleton";
import type { RoomWithCurrentStatus } from "@shared/schema";
import { Progress } from "@/components/ui/progress";

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [floorFilter, setFloorFilter] = useState<string>("all");
  const [capacityFilter, setCapacityFilter] = useState<string>("all");
  const [amenityPrefs, setAmenityPrefs] = useState<Record<string, boolean>>({
    "WiFi": false,
    "Projector": false,
    "Air Conditioning": false,
    "Whiteboard": false,
    "Smart TV": false,
  });

  // Fetch rooms
  const { data: rooms, isLoading } = useQuery<RoomWithCurrentStatus[]>({
    queryKey: ["/api/rooms"],
  });

  const { data: hotspots } = useQuery<any[]>({
    queryKey: ["/api/hotspots"],
  });

  // Deduplicate rooms on the client by building+floor+name (defensive against any backend/DB duplicates)
  const uniqueRooms: RoomWithCurrentStatus[] = useMemo(() => {
    const map = new Map<string, RoomWithCurrentStatus>();
    for (const r of rooms || []) {
      const key = `${r.building}-${r.floor}-${r.name}`;
      if (!map.has(key)) map.set(key, r);
    }
    return Array.from(map.values());
  }, [rooms]);

  // selected amenities array for matching/scoring
  const selectedAmenities = useMemo(() => Object.keys(amenityPrefs).filter(k => amenityPrefs[k]), [amenityPrefs]);

  // Filter rooms
  const filteredRooms = uniqueRooms.filter((room) => {
    const matchesSearch = 
      room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.building.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFloor = floorFilter === "all" || room.floor.toString() === floorFilter;
    
    const matchesCapacity = 
      capacityFilter === "all" ||
      (capacityFilter === "small" && room.capacity <= 20) ||
      (capacityFilter === "medium" && room.capacity > 20 && room.capacity <= 40) ||
      (capacityFilter === "large" && room.capacity > 40);

    const matchesAmenities = selectedAmenities.length === 0 || selectedAmenities.every(a => (room.amenities || []).includes(a));

    return matchesSearch && matchesFloor && matchesCapacity && matchesAmenities;
  });

  const sortedRooms = useMemo(() => {
    return [...filteredRooms].sort((a, b) => {
      const aAvail = a.currentReservation ? 0 : 1;
      const bAvail = b.currentReservation ? 0 : 1;
      if (aAvail !== bAvail) return bAvail - aAvail; // available first
      if (selectedAmenities.length === 0) return 0;
      const aScore = selectedAmenities.filter(ae => (a.amenities || []).includes(ae)).length;
      const bScore = selectedAmenities.filter(ae => (b.amenities || []).includes(ae)).length;
      if (aScore !== bScore) return bScore - aScore; // more matches first
      return 0;
    });
  }, [filteredRooms, selectedAmenities]);

  // Calculate stats
  const totalRooms = uniqueRooms.length || 0;
  const availableRooms = uniqueRooms.filter(r => !r.currentReservation).length || 0;
  const occupiedRooms = totalRooms - availableRooms;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold leading-tight" data-testid="text-page-title">
          Browse Classrooms
        </h1>
        <p className="text-muted-foreground mt-1">
          Find and reserve available rooms in the JGSOM building
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Rooms</p>
              <p className="text-2xl font-bold mt-1" data-testid="text-total-rooms">
                {totalRooms}
              </p>
            </div>
            <div className="h-12 w-12 bg-primary/10 rounded-md flex items-center justify-center">
              <MapPin className="h-6 w-6 text-primary" />
            </div>
          </div>
        </div>

        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Available Now</p>
              <p className="text-2xl font-bold mt-1 text-green-600" data-testid="text-available-rooms">
                {availableRooms}
              </p>
            </div>
            <div className="h-12 w-12 bg-green-100 dark:bg-green-900/20 rounded-md flex items-center justify-center">
              <div className="h-3 w-3 bg-green-600 rounded-full animate-pulse" />
            </div>
          </div>
        </div>

        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Currently Occupied</p>
              <p className="text-2xl font-bold mt-1" data-testid="text-occupied-rooms">
                {occupiedRooms}
              </p>
            </div>
            <div className="h-12 w-12 bg-destructive/10 rounded-md flex items-center justify-center">
              <div className="h-3 w-3 bg-destructive rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card border rounded-lg p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="lg:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by room name or building..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-search"
              />
            </div>
          </div>

          {/* Floor Filter */}
          <Select value={floorFilter} onValueChange={setFloorFilter}>
            <SelectTrigger data-testid="select-floor">
              <SelectValue placeholder="All Floors" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Floors</SelectItem>
              <SelectItem value="1">Floor 1</SelectItem>
              <SelectItem value="2">Floor 2</SelectItem>
              <SelectItem value="3">Floor 3</SelectItem>
              <SelectItem value="4">Floor 4</SelectItem>
              <SelectItem value="5">Floor 5</SelectItem>
            </SelectContent>
          </Select>

          {/* Capacity Filter */}
          <Select value={capacityFilter} onValueChange={setCapacityFilter}>
            <SelectTrigger data-testid="select-capacity">
              <SelectValue placeholder="Any Capacity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any Capacity</SelectItem>
              <SelectItem value="small">Small (≤20)</SelectItem>
              <SelectItem value="medium">Medium (21-40)</SelectItem>
              <SelectItem value="large">Large (40+)</SelectItem>
            </SelectContent>
          </Select>
          {/* Amenity Preferences */}
          <div className="lg:col-span-1">
            <p className="text-sm font-medium mb-2">Amenity Preferences</p>
            <div className="grid grid-cols-2 gap-2">
              {Object.keys(amenityPrefs).map((amenity) => (
                <label key={amenity} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={amenityPrefs[amenity]}
                    onCheckedChange={(v) => setAmenityPrefs(prev => ({ ...prev, [amenity]: Boolean(v) }))}
                  />
                  <span>{amenity}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Active Filters Summary */}
        {(searchQuery || floorFilter !== "all" || capacityFilter !== "all" || selectedAmenities.length > 0) && (
          <div className="flex items-center gap-2 mt-4 pt-4 border-t">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Showing {sortedRooms.length} of {totalRooms} rooms
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setFloorFilter("all");
                setCapacityFilter("all");
                setAmenityPrefs({ "WiFi": false, "Projector": false, "Air Conditioning": false, "Whiteboard": false, "Smart TV": false });
              }}
              data-testid="button-clear-filters"
            >
              Clear filters
            </Button>
          </div>
        )}
      </div>

      {/* Hotspots */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-card border rounded-lg p-4">
          <h3 className="font-semibold mb-3">Crowd Hotspots</h3>
          <div className="space-y-2">
            {hotspots?.slice(0, 6).map((h: any, i: number) => {
              // Hotspot crowd fraction
              const value = h.total ? (h.occupied / h.total) * 100 : 0;
              return (
                <div key={i} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span>{h.building} / Floor {h.floor}</span>
                    {/* Optionally you can tint bar if high occupancy, but we'll just show bar */}
                  </div>
                  {/* Progress bar with fraction text overlay */}
                  <div className="relative w-full flex items-center">
                    <Progress value={value} className="w-full h-5 bg-muted-foreground/10" />
                    {/* Absolute overlay the fraction text (centered) */}
                    <div className="absolute w-full left-0 top-0 h-full flex items-center justify-center pointer-events-none select-none text-xs font-medium"
                      style={{ color: value > 70 ? '#fff' : '#333', textShadow: value > 70 ? '0 0 4px rgba(0,0,0,0.5)' : 'none' }}
                    >
                      {h.occupied}/{h.total} full
                    </div>
                  </div>
                </div>
              );
            })}
            {!hotspots?.length && (
              <p className="text-sm text-muted-foreground">No hotspot data yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* Rooms Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="h-48 w-full rounded-lg" />
            </div>
          ))}
        </div>
      ) : sortedRooms.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {sortedRooms.map((room) => (
            <RoomCard key={room.id} room={room} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No rooms found</h3>
          <p className="text-muted-foreground mb-4">
            Try adjusting your filters or search query
          </p>
          <Button
            variant="outline"
            onClick={() => {
              setSearchQuery("");
              setFloorFilter("all");
              setCapacityFilter("all");
            }}
            data-testid="button-reset-filters"
          >
            Reset filters
          </Button>
        </div>
      )}
    </div>
  );
}
