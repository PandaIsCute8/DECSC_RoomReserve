import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";

export default function Signup() {
  const { toast } = useToast();
  const { signup, user } = useAuth();
  const [, setLocation] = useLocation();
  const [formValues, setFormValues] = useState({
    studentId: "",
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      setLocation("/dashboard");
    }
  }, [user, setLocation]);

  const handleChange = (field: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formValues.email.endsWith("@student.ateneo.edu")) {
      toast({
        title: "Invalid Email",
        description: "Please use your @student.ateneo.edu email.",
        variant: "destructive",
      });
      return;
    }

    if (!formValues.studentId.match(/^2\d{5}$/)) {
      toast({
        title: "Invalid Student ID",
        description: "Student ID must be in format 2xxxxx (2 followed by 5 digits)",
        variant: "destructive",
      });
      return;
    }

    if (formValues.password !== formValues.confirmPassword) {
      toast({
        title: "Passwords do not match",
        description: "Make sure the password fields match.",
        variant: "destructive",
      });
      return;
    }

    if (formValues.password.length < 8) {
      toast({
        title: "Password too short",
        description: "Password must be at least 8 characters.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await signup({
        studentId: formValues.studentId.trim(),
        firstName: formValues.firstName.trim(),
        lastName: formValues.lastName.trim(),
        email: formValues.email.trim().toLowerCase(),
        password: formValues.password,
      });
      toast({
        title: "Account created!",
        description: "Welcome to RoomReserve.",
      });
      setLocation("/dashboard");
    } catch (error: any) {
      toast({
        title: "Sign up failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-xl p-8 space-y-6 shadow-lg">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-semibold">Create your RoomReserve account</h1>
          <p className="text-sm text-muted-foreground">
            Fill in your student details to start reserving classrooms.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="studentId">Student ID</Label>
              <Input
                id="studentId"
                required
                value={formValues.studentId}
                onChange={(e) => handleChange("studentId", e.target.value)}
                placeholder="2xxxxx"
                pattern="^2\d{5}$"
                title="Student ID must start with 2 followed by 5 digits"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Ateneo Email</Label>
              <Input
                id="email"
                type="email"
                required
                value={formValues.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="you@student.ateneo.edu"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                required
                value={formValues.firstName}
                onChange={(e) => handleChange("firstName", e.target.value)}
                placeholder="Juan"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                required
                value={formValues.lastName}
                onChange={(e) => handleChange("lastName", e.target.value)}
                placeholder="Dela Cruz"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                value={formValues.password}
                onChange={(e) => handleChange("password", e.target.value)}
                placeholder="At least 8 characters"
                minLength={8}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                required
                value={formValues.confirmPassword}
                onChange={(e) => handleChange("confirmPassword", e.target.value)}
                minLength={8}
              />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Creating account..." : "Sign Up"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </Card>
    </div>
  );
}

