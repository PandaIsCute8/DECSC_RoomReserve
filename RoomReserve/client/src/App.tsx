import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { AuthProvider, useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Signup from "@/pages/signup";
import ForgotPassword from "@/pages/forgot-password";
import ResetPassword from "@/pages/reset-password";
import Dashboard from "@/pages/dashboard";
import RoomDetails from "@/pages/room-details";
import Bookings from "@/pages/bookings";
import Account from "@/pages/account";
import Admin from "@/pages/admin";
import { useEffect } from "react";

function ProtectedRoutes() {
  const { user, isLoading, logout } = useAuth();
  const [location, setLocation] = useLocation();

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  // Redirect to login if not authenticated (but allow access to auth pages)
  useEffect(() => {
    if (!isLoading && !user) {
      const authPaths = ["/", "/login", "/signup", "/forgot-password", "/reset-password"];
      const isAuthPath = authPaths.some(path => location === path || location.startsWith(path + "/"));
      if (!isAuthPath) {
        setLocation("/login");
      }
    }
  }, [user, isLoading, location, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Landing />;
  }

  const handleLogout = async () => {
    await logout();
    setLocation("/login");
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar user={user} />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between h-16 px-4 border-b bg-background">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">
                {user.name}
              </span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleLogout}
                data-testid="button-logout"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </header>
          <main className="flex-1 overflow-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <Switch>
                <Route path="/dashboard" component={Dashboard} />
                <Route path="/room/:id" component={RoomDetails} />
                <Route path="/bookings" component={Bookings} />
                <Route path="/account" component={Account} />
                <Route path="/admin" component={Admin} />
                <Route component={NotFound} />
              </Switch>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Switch>
            <Route path="/" component={Landing} />
            <Route path="/login" component={Landing} />
            <Route path="/signup" component={Signup} />
            <Route path="/forgot-password" component={ForgotPassword} />
            <Route path="/reset-password" component={ResetPassword} />
            <Route>
              <ProtectedRoutes />
            </Route>
          </Switch>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
