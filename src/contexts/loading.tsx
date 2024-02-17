import React, { createContext } from "react";

export const LoadingContext = createContext<{
  loading: boolean,
  setLoading: React.Dispatch<React.SetStateAction<boolean>>
} | null>(null);
