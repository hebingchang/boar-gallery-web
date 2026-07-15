import { useContext } from "react";
import { AuthContext } from "../contexts/auth.ts";

export default function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
