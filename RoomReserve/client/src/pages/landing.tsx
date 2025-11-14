import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Mail, CheckCircle2, Clock, Users, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import heroImage from "@assets/generated_images/JGSOM_classroom_collaboration_scene_c98a7c87.png";

export default function Landing() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { login, user } = useAuth();
  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      setLocation("/dashboard");
    }
  }, [user, setLocation]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!studentId.match(/^2\d{5}$/)) {
      toast({
        title: "Invalid Student ID",
        description: "Student ID must be in format 2xxxxx (2 followed by 5 digits)",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 8) {
      toast({
        title: "Invalid Password",
        description: "Password must be at least 8 characters",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      await login(studentId, password);
      toast({
        title: "Welcome!",
        description: "You've successfully signed in to RoomReserve.",
      });
      setLocation("/dashboard");
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message || "Please check your credentials and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left Column - Value Proposition */}
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-4xl lg:text-5xl font-bold leading-tight" data-testid="text-hero-title">
                  Reserve JGSOM Classrooms,
                  <span className="text-primary"> Instantly</span>
                </h1>
                <p className="text-xl text-muted-foreground leading-relaxed">
                  No more wandering around campus. See real-time availability and book your perfect study space in seconds.
                </p>
              </div>

              {/* Features Grid */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="flex gap-3">
                  <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">Real-Time Updates</h3>
                    <p className="text-sm text-muted-foreground">See which rooms are available right now</p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">Instant Booking</h3>
                    <p className="text-sm text-muted-foreground">Reserve in just a few clicks</p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">For Ateneo Students</h3>
                    <p className="text-sm text-muted-foreground">Secure access with your @student.ateneo.edu email</p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">Email Reminders</h3>
                    <p className="text-sm text-muted-foreground">Never miss your booking</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Shield className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">Secure Accounts</h3>
                    <p className="text-sm text-muted-foreground">Passwords & reset links protect access</p>
                  </div>
                </div>
              </div>

              {/* Login Form */}
              <Card className="p-6">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="studentId">Student ID</Label>
                    <Input
                      id="studentId"
                      type="text"
                      placeholder="2xxxxx"
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                      required
                      pattern="^2\d{5}$"
                      title="Student ID must start with 2 followed by 5 digits"
                      data-testid="input-student-id"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password">Account Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={8}
                      data-testid="input-password"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    disabled={isLoading}
                    data-testid="button-signin"
                  >
                    {isLoading ? "Signing in..." : "Sign In"}
                  </Button>

                  <div className="flex items-center justify-between text-xs">
                    <Link href="/forgot-password" className="text-primary hover:underline">
                      Forgot password?
                    </Link>
                    <span className="text-muted-foreground">
                      No account?{" "}
                      <Link href="/signup" className="text-primary hover:underline">
                        Sign up
                      </Link>
                    </span>
                  </div>
                </form>
              </Card>

              <p className="text-xs text-muted-foreground text-center">
                Your password protects your reservations. Keep it safe and never share it with others.
              </p>
            </div>

            {/* Right Column - Hero Image */}
            <div className="hidden lg:block">
              <div className="relative rounded-lg overflow-hidden shadow-2xl">
                <img
                  src={heroImage}
                  alt="Students collaborating in JGSOM classroom"
                  className="w-full h-auto"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t mt-12 lg:mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-sm text-muted-foreground">
            RoomReserve &copy; 2025 - Ateneo de Manila University, JGSOM Building
          </p>
        </div>
      </div>
    </div>
  );
}
