import React, { createContext } from "react";

export const MapTokenContext = createContext<{
  token: string,
  setToken: React.Dispatch<React.SetStateAction<string>>
} | null>(null);
