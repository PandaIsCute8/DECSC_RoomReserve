import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function ResetPassword() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get("token");
    if (tokenParam) {
      // URLSearchParams.get() already decodes, but handle edge cases
      let decodedToken = tokenParam;
      try {
        // Only decode if it looks encoded (contains %)
        if (tokenParam.includes("%")) {
          decodedToken = decodeURIComponent(tokenParam);
        }
      } catch (e) {
        // If decoding fails, use original
        decodedToken = tokenParam;
      }
      const cleanToken = decodedToken.trim();
      console.log("Reset password: Token extracted from URL", {
        tokenLength: cleanToken.length,
        tokenPrefix: cleanToken.substring(0, 8) + "..."
      });
      setToken(cleanToken);
    } else {
      toast({
        title: "Invalid link",
        description: "No reset token found in the URL.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({
        title: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 8) {
      toast({
        title: "Password too short",
        description: "Password must be at least 8 characters.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Ensure token is trimmed before sending
      const cleanToken = token.trim();
      console.log("Reset password: Submitting", {
        tokenLength: cleanToken.length,
        tokenPrefix: cleanToken.substring(0, 8) + "..."
      });
      await apiRequest("POST", "/api/auth/reset-password", { token: cleanToken, newPassword: password });
      toast({
        title: "Password reset successfully",
        description: "You can now sign in with your new password.",
      });
      setLocation("/login");
    } catch (error: any) {
      console.error("Reset password: Error caught", error);
      let errorMessage = "The reset link may be invalid or expired.";
      
      // Try to extract more detailed error message
      if (error.message) {
        try {
          // If error message contains JSON, try to parse it
          const match = error.message.match(/\{.*\}/);
          if (match) {
            const errorData = JSON.parse(match[0]);
            errorMessage = errorData.message || errorData.details || errorMessage;
            if (errorData.errors && Array.isArray(errorData.errors)) {
              errorMessage += " " + errorData.errors.map((e: any) => e.message).join(", ");
            }
          } else {
            errorMessage = error.message;
          }
        } catch (e) {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Reset failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md p-8 space-y-6 shadow-lg">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-semibold">Reset Password</h1>
          <p className="text-sm text-muted-foreground">
            Enter your new password below.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">New Password</Label>
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              minLength={8}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              minLength={8}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting || !token}>
            {isSubmitting ? "Resetting..." : "Reset Password"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          <Link href="/login" className="text-primary hover:underline">
            Back to Login
          </Link>
        </p>
      </Card>
    </div>
  );
}

