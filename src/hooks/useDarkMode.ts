import { useContext } from "react";
import { DarkModeContext } from "../contexts/dark_mode.ts";

export default function useDarkMode() {
  const state = useContext(DarkModeContext);

  if (!state) {
    throw new Error("useDarkMode must be used within a DarkModeProvider");
  }

  return state;
}
