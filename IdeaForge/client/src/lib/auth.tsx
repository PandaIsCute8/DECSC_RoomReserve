import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { User } from "@shared/schema";

interface AuthContextType {
  user: User | null;
  sessionId: string | null;
  isLoading: boolean;
  login: (email: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [sessionId, setSessionId] = useState<string | null>(
    localStorage.getItem("sessionId")
  );

  // Fetch current user
  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["/api/auth/me"],
    enabled: !!sessionId,
    retry: false,
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async ({ email, name }: { email: string; name: string }) => {
      const response = await apiRequest("POST", "/api/auth/login", { email, name });
      return response;
    },
    onSuccess: (data: any) => {
      setSessionId(data.sessionId);
      localStorage.setItem("sessionId", data.sessionId);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/auth/logout", {});
    },
    onSuccess: () => {
      setSessionId(null);
      localStorage.removeItem("sessionId");
      queryClient.clear();
    },
  });

  const login = async (email: string, name: string) => {
    await loginMutation.mutateAsync({ email, name });
  };

  const logout = async () => {
    await logoutMutation.mutateAsync();
  };

  return (
    <AuthContext.Provider
      value={{
        user: user || null,
        sessionId,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
