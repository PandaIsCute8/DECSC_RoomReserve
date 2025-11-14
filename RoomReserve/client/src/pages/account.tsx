import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";

export default function Account() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [formValues, setFormValues] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!user) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formValues.newPassword !== formValues.confirmPassword) {
      toast({
        title: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (formValues.newPassword.length < 8) {
      toast({
        title: "Password too short",
        description: "Password must be at least 8 characters.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await apiRequest("POST", "/api/auth/change-password", {
        currentPassword: formValues.currentPassword,
        newPassword: formValues.newPassword,
      });
      toast({
        title: "Password updated",
        description: "Your new password is active.",
      });
      setFormValues({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold leading-tight">Account Manager</h1>
        <p className="text-muted-foreground mt-1">
          Update your account details and secure your password.
        </p>
      </div>

      <Card className="p-6 space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Profile</h2>
          <p className="text-sm text-muted-foreground">
            These details are managed by your school. Contact support for changes.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-xs text-muted-foreground">Full Name</Label>
            <p className="font-medium">{user.name}</p>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Student ID</Label>
            <p className="font-medium">{user.studentId ?? "—"}</p>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Email</Label>
            <p className="font-medium break-all">{user.email}</p>
          </div>
        </div>
      </Card>

      <Card className="p-6 space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Change Password</h2>
          <p className="text-sm text-muted-foreground">
            Use a unique password to protect your reservations.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current Password</Label>
            <Input
              id="currentPassword"
              type="password"
              required
              value={formValues.currentPassword}
              onChange={(e) => setFormValues((prev) => ({ ...prev, currentPassword: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <Input
              id="newPassword"
              type="password"
              required
              value={formValues.newPassword}
              onChange={(e) => setFormValues((prev) => ({ ...prev, newPassword: e.target.value }))}
              minLength={8}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              required
              value={formValues.confirmPassword}
              onChange={(e) =>
                setFormValues((prev) => ({ ...prev, confirmPassword: e.target.value }))
              }
              minLength={8}
            />
          </div>

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Updating..." : "Update Password"}
          </Button>
        </form>
      </Card>
    </div>
  );
}

