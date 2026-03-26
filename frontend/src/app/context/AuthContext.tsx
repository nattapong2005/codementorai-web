"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../utils/api";
import { User } from "../types/user";
import { LoginRequest } from "../types/auth";
import { usePathname } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  login: (credentials: LoginRequest) => Promise<User>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const pathname = usePathname();
  const login = async ({ std_id, password }: LoginRequest): Promise<User> => {
    await api.post(
      "/auth/login",
      { std_id, password },
      { withCredentials: true }
    );
    const user = await fetchMe();
    return user;
  };

  const fetchMe = async (): Promise<User> => {
    const { data } = await api.get("/users/me", {
      withCredentials: true,
    });
    setUser(data);
    return data;
  };

  const logout = async (): Promise<void> => {
    await api.post("/auth/logout", {}, { withCredentials: true });
    setUser(null);
  };

   useEffect(() => {
    if (pathname === "/login") return; 

    (async () => {
      try {
        await fetchMe();
      } catch {
        setUser(null);
      }
    })();
  }, [pathname]);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext)!;
};
