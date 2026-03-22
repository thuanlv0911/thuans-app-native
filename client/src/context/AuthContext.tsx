import { API_BASE_URL } from "@/src/config/api";
import * as SecureStore from "expo-secure-store";
import React, { createContext, useContext, useEffect, useState } from "react";

type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt?: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<AuthUser>;
  signUp: (name: string, email: string, password: string) => Promise<AuthUser>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateName: (name: string) => Promise<void>;
};

type AuthResponse = {
  message?: string;
  token?: string;
  user?: AuthUser;
};

const AUTH_TOKEN_KEY = "auth_token";
const AUTH_USER_KEY = "auth_user";

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const parseErrorMessage = async (response: Response) => {
  try {
    const data = (await response.json()) as AuthResponse;
    return data.message || "Request failed";
  } catch {
    return "Request failed";
  }
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const [storedToken, storedUser] = await Promise.all([
          SecureStore.getItemAsync(AUTH_TOKEN_KEY),
          SecureStore.getItemAsync(AUTH_USER_KEY),
        ]);

        if (storedToken) {
          setToken(storedToken);
        }

        if (storedUser) {
          setUser(JSON.parse(storedUser) as AuthUser);
        }

        if (storedToken) {
          try {
            const data = await sendAuthRequest("/auth/me", undefined, storedToken);

            if (data.user) {
              setUser(data.user);
              await SecureStore.setItemAsync(AUTH_USER_KEY, JSON.stringify(data.user));
            }
          } catch {
            await Promise.all([
              SecureStore.deleteItemAsync(AUTH_TOKEN_KEY),
              SecureStore.deleteItemAsync(AUTH_USER_KEY),
            ]);
            setToken(null);
            setUser(null);
          }
        }
      } finally {
        setIsLoading(false);
      }
    };

    bootstrap();
  }, []);

  const persistSession = async (nextToken: string, nextUser: AuthUser) => {
    setToken(nextToken);
    setUser(nextUser);
    await Promise.all([
      SecureStore.setItemAsync(AUTH_TOKEN_KEY, nextToken),
      SecureStore.setItemAsync(AUTH_USER_KEY, JSON.stringify(nextUser)),
    ]);
  };

  const sendAuthRequest = async (endpoint: string, body?: Record<string, string>, requestToken?: string) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: body ? "POST" : "GET",
      headers: {
        "Content-Type": "application/json",
        ...(requestToken ? { Authorization: `Bearer ${requestToken}` } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });

    if (!response.ok) {
      throw new Error(await parseErrorMessage(response));
    }

    return (await response.json()) as AuthResponse;
  };

  const signIn = async (email: string, password: string) => {
    const data = await sendAuthRequest("/auth/login", { email, password });

    if (!data.token || !data.user) {
      throw new Error("Missing auth payload from server");
    }

    await persistSession(data.token, data.user);
    return data.user;
  };

  const signUp = async (name: string, email: string, password: string) => {
    const data = await sendAuthRequest("/auth/register", { name, email, password });

    if (!data.token || !data.user) {
      throw new Error("Missing auth payload from server");
    }

    await persistSession(data.token, data.user);
    return data.user;
  };

  const signOut = async () => {
    setUser(null);
    setToken(null);
    await Promise.all([
      SecureStore.deleteItemAsync(AUTH_TOKEN_KEY),
      SecureStore.deleteItemAsync(AUTH_USER_KEY),
    ]);
  };

  const refreshProfile = async () => {
    if (!token) {
      return;
    }

    const data = await sendAuthRequest("/auth/me", undefined, token);

    if (!data.user) {
      throw new Error("Unable to load user profile");
    }

    setUser(data.user);
    await SecureStore.setItemAsync(AUTH_USER_KEY, JSON.stringify(data.user));
  };

  const updateName = async (name: string) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    const trimmed = name.trim();
    if (!trimmed) {
      throw new Error('Name cannot be empty');
    }

    const updatedUser = { ...user, name: trimmed };
    setUser(updatedUser);
    await SecureStore.setItemAsync(AUTH_USER_KEY, JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: Boolean(user && token),
        isAdmin: user?.role === "admin",
        signIn,
        signUp,
        signOut,
        refreshProfile,
        updateName,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
