import {
  createContext,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/endpoints";
import { ApiError, setAccessToken } from "@/api/client";
import type { User } from "@/api/types";
import { sessionStorage } from "./storage";

type AuthContextValue = {
  user: User | null;
  isBootstrapping: boolean;
  bootstrapError: string | null;
  retryBootstrap(): void;
  login(input: { email: string; password: string }): Promise<void>;
  register(input: {
    firstName: string;
    surname: string;
    email: string;
    password: string;
  }): Promise<void>;
  logout(): Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [isBootstrapping, setBootstrapping] = useState(true);
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);
  const [bootstrapAttempt, setBootstrapAttempt] = useState(0);
  const queryClient = useQueryClient();

  useEffect(() => {
    let active = true;
    void (async () => {
      const token = await sessionStorage.get();
      if (!token) {
        if (active) setBootstrapping(false);
        return;
      }
      setAccessToken(token);
      setBootstrapError(null);
      try {
        const profile = await api.me();
        if (active) setUser(profile);
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          setAccessToken(null);
          await sessionStorage.clear();
        } else if (active) {
          setBootstrapError(
            "Your session could not be checked. Check your connection and try again.",
          );
        }
      } finally {
        if (active) setBootstrapping(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [bootstrapAttempt]);

  const acceptSession = async (
    result: Awaited<ReturnType<typeof api.login>>,
  ) => {
    setAccessToken(result.token);
    await sessionStorage.set(result.token);
    setUser(result.user);
  };

  const login = async (input: { email: string; password: string }) =>
    acceptSession(await api.login(input));
  const register = async (input: {
    firstName: string;
    surname: string;
    email: string;
    password: string;
  }) => acceptSession(await api.register(input));
  const logout = async () => {
    try {
      await api.logout();
    } finally {
      setAccessToken(null);
      await sessionStorage.clear();
      setUser(null);
      queryClient.clear();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isBootstrapping,
        bootstrapError,
        retryBootstrap: () => {
          setBootstrapping(true);
          setBootstrapAttempt((attempt) => attempt + 1);
        },
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
};
