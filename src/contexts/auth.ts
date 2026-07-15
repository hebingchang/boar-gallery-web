import { createContext } from "react";
import { LoginResponse } from "../models/gallery.ts";

export interface AuthorSession {
  token: string;
  tokenType: string;
  expiresAt: string;
  author: {
    id: number;
    name: string;
  };
}

export interface AuthContextValue {
  session: AuthorSession | null;
  isAuthenticated: boolean;
  login: (response: LoginResponse) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
