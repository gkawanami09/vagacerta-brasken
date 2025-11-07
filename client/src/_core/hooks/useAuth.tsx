import { createContext, useCallback, useContext, useMemo } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

type AuthUser = {
  id: number;
  name?: string | null;
  email?: string | null;
  role?: string | null;
};

type AuthProfile = {
  phone?: string | null;
  cpf?: string | null;
  location?: string | null;
  notification_whatsapp?: boolean | null;
  notification_push?: boolean | null;
  notification_email?: boolean | null;
};

type AuthContextValue = {
  user: AuthUser | null;
  profile: AuthProfile | null;
  isLoading: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();

  const {
    data: user,
    isLoading: userLoading,
    refetch: refetchUser,
  } = trpc.auth.me.useQuery(undefined, {
    retry: false,
  });

  const {
    data: profile,
    isLoading: profileLoading,
    refetch: refetchProfile,
  } = trpc.userProfile.get.useQuery(undefined, {
    enabled: Boolean(user?.id),
  });

  const logoutMutation = trpc.auth.logout.useMutation();

  const refresh = useCallback(async () => {
    const result = await refetchUser();
    if (result.data?.id) {
      await refetchProfile();
    }
  }, [refetchUser, refetchProfile]);

  const signOut = useCallback(async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch (error) {
      console.error("[Auth] Falha ao encerrar sessao:", error);
    } finally {
      await Promise.all([
        utils.auth.me.invalidate(),
        utils.userProfile.get.invalidate(),
      ]);
      setLocation("/");
      if (typeof window !== "undefined") {
        window.location.assign("/");
      }
    }
  }, [logoutMutation, setLocation, utils]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: user ?? null,
      profile: profile ?? null,
      isLoading: userLoading || (Boolean(user?.id) && profileLoading),
      refresh,
      signOut,
    }),
    [user, profile, userLoading, profileLoading, refresh, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
