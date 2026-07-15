import { createContext } from "react";

export interface DarkModeState {
  value: boolean;
  enable: () => void;
  disable: () => void;
  toggle: () => void;
}

export const DarkModeContext = createContext<DarkModeState | null>(null);
